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

class CompatBluetoothService {
  initialize() {
    return coreBT.initialize();
  }

  requestPermissions() {
    // Some platforms don’t expose this; normalize to a Promise.
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
    const connected = await toPromise(coreBT.isDeviceConnected());
    return !!connected;
  }

  scanForDevices() { return coreBT.scanForDevices(); }
  isMachharDevice(deviceId: string) { return coreBT.isMachharDevice(deviceId); }
  connect(device: { id: string; name?: string | null }) { return coreBT.connect(device); }
  disconnect() { return coreBT.disconnect(); }

  async isDeviceConnected(): Promise<boolean> {
    const v = await toPromise(coreBT.isDeviceConnected());
    return !!v;
  }

  onConnectionChange(cb: (v: boolean) => void) {
    // Normalize any payload to boolean for app code.
    return coreBT.onConnectionChange((v: any) => cb(!!v));
  }

  /** App-facing reads with soft-fail semantics for optional services. */
  async readDeviceData(): Promise<DeviceData> {
    const [bRes, dRes] = await Promise.allSettled([
      toPromise(coreBT.getBatteryLevel?.()),
      toPromise(coreBT.getDeviceInfo?.()),
    ]);

    // Soft fallbacks unless the error truly indicates a disconnect.
    let batteryLevel: number | undefined = undefined;
    if (bRes.status === "fulfilled") {
      batteryLevel = typeof bRes.value === "number" ? bRes.value : undefined;
    } else if (isDisconnecty(bRes.reason)) {
      throw bRes.reason;
    }

    let deviceInfo: DeviceData["deviceInfo"] | undefined = undefined;
    if (dRes.status === "fulfilled") {
      deviceInfo = dRes.value;
    } else if (isDisconnecty(dRes.reason)) {
      throw dRes.reason;
    }

    return { batteryLevel, deviceInfo };
  }

  /** Alias retained for existing callers. */
  refreshDeviceData() {
    return this.readDeviceData();
  }
}

export const BluetoothService = new CompatBluetoothService();
export default BluetoothService;
