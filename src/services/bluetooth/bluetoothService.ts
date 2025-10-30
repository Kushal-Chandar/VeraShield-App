import { bluetoothService as core } from "@/lib/bluetooth";

/** Shape the minimal core we rely on to keep TS happy, without over-constraining. */
type CoreBluetooth = {
  initialize: () => Promise<void> | void;
  requestPermissions?: () => Promise<void> | void;
  isBluetoothEnabled?: () => Promise<boolean> | boolean;
  scanForDevices: (...args: any[]) => any;
  isMachharDevice: (id: string) => boolean;
  connect: (device: { id: string; name?: string | null }) => Promise<void> | void;
  disconnect: () => Promise<void> | void;
  isDeviceConnected: () => Promise<boolean> | boolean;
  onConnectionChange: (cb: (v: any) => void) => () => void;

  // Optional reads (must never be treated as fatal by the wrapper)
  getBatteryLevel?: () => Promise<number> | number;
  getDeviceInfo?: () => Promise<DeviceData["deviceInfo"]> | DeviceData["deviceInfo"];
};

const coreBT: CoreBluetooth = core as unknown as CoreBluetooth;

export type DeviceData = {
  batteryLevel?: number;
  deviceInfo?: {
    modelNumber?: string;
    manufacturerName?: string;
    serialNumber?: string;
    firmwareRevision?: string;
    hardwareRevision?: string;
    softwareRevision?: string;
  };
};

/** Narrow the value into a Promise no matter what we get back (value, promise, or undefined). */
function toPromise<T>(val: T | Promise<T> | undefined): Promise<T | undefined> {
  return Promise.resolve(val as T | Promise<T> | undefined);
}

/** Only actual disconnect-ish messages should flip app state elsewhere. */
function isDisconnecty(err: unknown): boolean {
  const s = String((err as any)?.message ?? err ?? "").toLowerCase();
  return (
    s.includes("not connected") ||
    s.includes("device disconnected") ||
    s.includes("gatt 133") ||
    s.includes("connection was closed")
  );
}

/** Very small 1-at-a-time queue for GATT ops (prevents “post-connect stampede”). */
class OpQueue {
  private chain: Promise<unknown> = Promise.resolve();
  run<T>(fn: () => Promise<T>, gapMs = 120): Promise<T> {
    const exec = async () => {
      try {
        const out = await fn();
        // small gap to give the OS stack breathing room
        if (gapMs > 0) await new Promise(r => setTimeout(r, gapMs));
        return out;
      } catch (e) {
        if (gapMs > 0) await new Promise(r => setTimeout(r, gapMs));
        throw e;
      }
    };
    const next = this.chain.then(exec, exec);
    this.chain = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }
}

class CompatBluetoothService {
  /** Cached connection state for instant reads in hook initializers. */
  private _connected = false;
  /** Public sync snapshot (don’t use this to *decide* to do BLE; subscribe + await instead). */
  get isConnectedCached(): boolean { return this._connected; }

  private q = new OpQueue();

  initialize(): Promise<void> {
    return toPromise(coreBT.initialize()) as Promise<void>;
  }

  requestPermissions(): Promise<void | undefined> {
    return toPromise(coreBT.requestPermissions?.());
  }

  /** Prefer the core’s probe. Fallback to plugin (if present), then to connection heuristic. */
  async isBluetoothEnabled(): Promise<boolean> {
    await this.initialize();

    if (typeof coreBT.isBluetoothEnabled === "function") {
      const v = await toPromise(coreBT.isBluetoothEnabled());
      if (typeof v === "boolean") return v;
    }

    // Capacitor/BleClient fallback without importing types:
    try {
      const maybeEnabled =
        (globalThis as any)?.BleClient?.isEnabled &&
        (await (globalThis as any).BleClient.isEnabled());
      if (typeof maybeEnabled === "boolean") return maybeEnabled;
    } catch {
      /* ignore */
    }

    // Last resort: if we’re connected, BT must be enabled.
    const connected = await this.isDeviceConnected();
    return !!connected;
  }

  scanForDevices(...args: any[]) {
    // Scanning can be chatty; let core handle rate limiting.
    return coreBT.scanForDevices(...args);
  }

  isMachharDevice(deviceId: string) { return coreBT.isMachharDevice(deviceId); }

  /** Connect is queued to avoid overlapping with any in-flight reads/writes. */
  async connect(device: { id: string; name?: string | null }): Promise<void> {
    await this.q.run(async () => {
      await toPromise(coreBT.connect(device));
      // After connect, update cache by probing once.
      this._connected = !!(await this.isDeviceConnected());
    }, 250); // slightly larger post-connect gap
  }

  async disconnect(): Promise<void> {
    await this.q.run(async () => {
      await toPromise(coreBT.disconnect());
      this._connected = false;
    }, 0);
  }

  /** Always returns a Promise and refreshes the cached snapshot. */
  async isDeviceConnected(): Promise<boolean> {
    const v = await this.q.run(async () => {
      const res = await toPromise(coreBT.isDeviceConnected());
      return !!res;
    }, 0);
    this._connected = v;
    return v;
  }

  /** Normalize any payload to boolean for app code and keep cache in sync. */
  onConnectionChange(cb: (v: boolean) => void) {
    return coreBT.onConnectionChange((v: any) => {
      const b = !!v;
      this._connected = b;
      cb(b);
    });
  }

  /** App-facing reads with soft-fail semantics for optional services, serialized. */
  async readDeviceData(): Promise<DeviceData> {
    return this.q.run(async () => {
      const [bRes, dRes] = await Promise.allSettled([
        toPromise(coreBT.getBatteryLevel?.()),
        toPromise(coreBT.getDeviceInfo?.()),
      ]);

      // Soft fallbacks unless the error truly indicates a disconnect.
      let batteryLevel: number | undefined = undefined;
      if (bRes.status === "fulfilled") {
        batteryLevel = typeof bRes.value === "number" ? bRes.value : undefined;
      } else if (isDisconnecty(bRes.reason)) {
        this._connected = false;
        throw bRes.reason;
      }

      let deviceInfo: DeviceData["deviceInfo"] | undefined = undefined;
      if (dRes.status === "fulfilled") {
        deviceInfo = dRes.value;
      } else if (isDisconnecty(dRes.reason)) {
        this._connected = false;
        throw dRes.reason;
      }

      return { batteryLevel, deviceInfo };
    });
  }

  /** Alias retained for existing callers. */
  refreshDeviceData() {
    return this.readDeviceData();
  }
}

export const BluetoothService = new CompatBluetoothService();
export default BluetoothService;
