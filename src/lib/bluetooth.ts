import { BleClient } from "@capacitor-community/bluetooth-le";

/* UUIDs */
export const MACHHAR_SERVICE_UUID = "00004000-1212-efde-1523-785feabcd123";
export const MACHHAR_GADI_SYNC_UUID = "00004001-1212-efde-1523-785feabcd123";
export const MACHHAR_SCHEDULING_UUID = "00004002-1212-efde-1523-785feabcd123";
export const MACHHAR_STATISTICS_UUID = "00004003-1212-efde-1523-785feabcd123";
export const MACHHAR_REMOTE_SPRAY_UUID = "00004004-1212-efde-1523-785feabcd123";

export const BATTERY_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";
export const BATTERY_LEVEL_UUID = "00002a19-0000-1000-8000-00805f9b34fb";

export const DEVICE_INFORMATION_SERVICE_UUID = "0000180a-0000-1000-8000-00805f9b34fb";
export const MODEL_NUMBER_UUID = "00002a24-0000-1000-8000-00805f9b34fb";
export const MANUFACTURER_NAME_UUID = "00002a29-0000-1000-8000-00805f9b34fb";
export const SERIAL_NUMBER_UUID = "00002a25-0000-1000-8000-00805f9b34fb";
export const FIRMWARE_REVISION_UUID = "00002a26-0000-1000-8000-00805f9b34fb";
export const HARDWARE_REVISION_UUID = "00002a27-0000-1000-8000-00805f9b34fb";
export const SOFTWARE_REVISION_UUID = "00002a28-0000-1000-8000-00805f9b34fb";

/* Types exported for callers */
export interface DeviceInfo {
    modelNumber: string;
    manufacturerName: string;
    serialNumber: string;
    firmwareRevision: string;
    hardwareRevision: string;
    softwareRevision: string;
}

export interface ScheduleEntry {
    time7: number[]; // length 7
    intensity2b: number; // 0..3
}
export interface ParsedSchedule {
    count: number;
    entries: ScheduleEntry[];
}

export interface StatsEntry {
    time7: number[];
    intensity2b: number;
}
export interface ParsedStats {
    total: number;
    window: number;
    entries: StatsEntry[];
}

export interface BluetoothService {
    initialize(): Promise<void>;
    requestPermissions(): Promise<void>;
    scanForDevices(): Promise<Array<{ name: string; id: string; rssi?: number }>>;
    isMachharDevice(deviceId: string): Promise<boolean>;
    connect(device: { id: string; name?: string | null }): Promise<void>;
    disconnect(): Promise<void>;
    isDeviceConnected(): boolean;
    onConnectionChange(cb: (connected: boolean) => void): () => void;

    /* app features */
    syncTimeFromDate(d: Date): Promise<void>;
    syncTimeRaw(time7: number[]): Promise<void>;
    readSchedule(): Promise<ParsedSchedule>;
    writeSchedule(entries: ScheduleEntry[]): Promise<void>;
    readStatistics(start: number, window: number): Promise<ParsedStats>;
    testSpray(state?: number): Promise<void>;
    getBatteryLevel(): Promise<number>;
    getDeviceInfo(): Promise<DeviceInfo>;
    getDeviceServices(): Promise<any>;
}

/* Helpers */
function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

async function withTimeout<T>(p: Promise<T>, ms: number, label = "operation"): Promise<T> {
    let timer: any;
    const timeout = new Promise<T>((_, rej) => {
        timer = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    try {
        return await Promise.race([p, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

function clamp(n: number, lo: number, hi: number) {
    if (Number.isNaN(Number(n))) return lo;
    return Math.max(lo, Math.min(hi, Math.floor(n)));
}

function dataViewToNumbers(dv: DataView) {
    const a: number[] = [];
    for (let i = 0; i < dv.byteLength; i++) a.push(dv.getUint8(i));
    return a;
}

function numbersToDataView(bytes: number[]) {
    const ab = new ArrayBuffer(bytes.length);
    const dv = new DataView(ab);
    for (let i = 0; i < bytes.length; i++) dv.setUint8(i, bytes[i] & 0xff);
    return dv;
}

/* Internal connected device representation */
type ConnectedDevice = { deviceId: string; name?: string | null } | null;

/* Implementation */
class MachharBluetoothServiceImpl implements BluetoothService {
    private initialized = false;
    private connected: ConnectedDevice = null;
    private connectionListeners: Array<(connected: boolean) => void> = [];
    private readonly scanTimeoutMs = 10_000;
    private readonly connectTimeoutMs = 15_000;

    async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            await BleClient.initialize();
        } catch {
            // Some platforms might not need explicit init or may throw in web - ignore
        }
        this.initialized = true;
    }

    async requestPermissions(): Promise<void> {
        await this.initialize();
        // best-effort - some environments expose permission helpers; ignore failures
        try {
            // @ts-ignore
            if (typeof (BleClient as any).requestLEPermissions === "function") {
                // @ts-ignore
                await (BleClient as any).requestLEPermissions();
            }
        } catch {
            // ignore
        }
    }

    onConnectionChange(cb: (connected: boolean) => void): () => void {
        if (typeof cb !== "function") return () => { };
        this.connectionListeners.push(cb);
        try {
            cb(this.isDeviceConnected());
        } catch { }
        return () => {
            this.connectionListeners = this.connectionListeners.filter((c) => c !== cb);
        };
    }

    private notifyConnectionChange() {
        const v = this.isDeviceConnected();
        this.connectionListeners.slice().forEach((cb) => {
            try {
                cb(v);
            } catch { }
        });
    }

    async scanForDevices(): Promise<Array<{ name: string; id: string; rssi?: number }>> {
        await this.initialize();
        const results: Array<{ name: string; id: string; rssi?: number }> = [];
        let active = true;
        try {
            await BleClient.requestLEScan({ allowDuplicates: false }, (res) => {
                if (!active || !res || !res.device) return;
                const id = (res.device.deviceId ?? res.device.id ?? res.device.identifier) as string;
                const name = res.device.name ?? res.device.localName ?? "Unknown";
                if (!results.find((d) => d.id === id)) results.push({ id, name, rssi: res.rssi });
            });
            await sleep(this.scanTimeoutMs);
        } finally {
            active = false;
            try {
                await BleClient.stopLEScan();
            } catch {
                // ignore
            }
        }
        results.sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100));
        return results;
    }

    async isMachharDevice(deviceId: string): Promise<boolean> {
        try {
            const services = await BleClient.getServices(deviceId);
            return services.some((s) => (s.uuid ?? "").toString().toLowerCase() === MACHHAR_SERVICE_UUID.toLowerCase());
        } catch {
            return false;
        }
    }

    async connect(device: { id: string; name?: string | null }): Promise<void> {
        await this.initialize();
        if (this.connected && this.connected.deviceId === device.id) return;
        if (this.connected) {
            await this.disconnect().catch(() => { });
        }

        await withTimeout(
            BleClient.connect(device.id, (disconnectedDeviceId?: string) => {
                // disconnect callback
                this.connected = null;
                this.notifyConnectionChange();
            }),
            this.connectTimeoutMs,
            "BLE connect"
        );

        this.connected = { deviceId: device.id, name: device.name ?? null };
        this.notifyConnectionChange();

        // allow services to settle
        await sleep(300);

        const ok = await this.isMachharDevice(device.id);
        if (!ok) {
            await this.disconnect().catch(() => { });
            throw new Error("Machhar service not found on device");
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected) return;
        const id = this.connected.deviceId;
        try {
            // best-effort: write a harmless byte to remote-spray to let FW know (optional)
            try {
                const dv = numbersToDataView([0xff]);
                await BleClient.write(id, MACHHAR_SERVICE_UUID, MACHHAR_REMOTE_SPRAY_UUID, dv);
                await sleep(100);
            } catch { }
            await BleClient.disconnect(id);
        } catch {
            // ignore
        } finally {
            this.connected = null;
            this.notifyConnectionChange();
        }
    }

    isDeviceConnected(): boolean {
        return !!this.connected;
    }

    getDeviceServices(): Promise<any> {
        if (!this.connected) return Promise.reject(new Error("Not connected"));
        return BleClient.getServices(this.connected.deviceId);
    }

    private ensureConnected(): asserts this is MachharBluetoothServiceImpl & { connected: { deviceId: string } } {
        if (!this.connected) throw new Error("Device not connected");
    }

    private async readCharacteristic(service: string, characteristic: string): Promise<number[]> {
        this.ensureConnected();
        try {
            const dv = await BleClient.read(this.connected.deviceId, service, characteristic);
            return dataViewToNumbers(dv);
        } catch (err) {
            // clear state if read fails due to disconnect
            this.connected = null;
            this.notifyConnectionChange();
            throw err;
        }
    }

    private async writeCharacteristic(service: string, characteristic: string, bytes: number[]): Promise<void> {
        this.ensureConnected();
        try {
            const dv = numbersToDataView(bytes);
            await BleClient.write(this.connected.deviceId, service, characteristic, dv);
        } catch (err) {
            this.connected = null;
            this.notifyConnectionChange();
            throw err;
        }
    }

    private parseSchedulePayload(raw: number[]): ParsedSchedule {
        if (!Array.isArray(raw) || raw.length < 1) return { count: 0, entries: [] };
        const countFromRaw = raw[0] ?? 0;
        const entries: ScheduleEntry[] = [];
        for (let i = 0; i < countFromRaw; i++) {
            const base = 1 + i * 8;
            if (base + 8 > raw.length) break;
            const time7 = raw.slice(base, base + 7);
            const intensity2b = raw[base + 7] & 0x03;
            entries.push({ time7, intensity2b });
        }
        return { count: countFromRaw, entries };
    }

    private parseStatsPayload(raw: number[]): ParsedStats {
        if (!Array.isArray(raw) || raw.length < 2) return { total: 0, window: 0, entries: [] };
        const total = raw[0] ?? 0;
        const windowFromRaw = raw[1] ?? 0;
        const entries: StatsEntry[] = [];
        for (let i = 0; i < windowFromRaw; i++) {
            const base = 2 + i * 8;
            if (base + 8 > raw.length) break;
            const time7 = raw.slice(base, base + 7);
            const intensity2b = raw[base + 7] & 0x03;
            entries.push({ time7, intensity2b });
        }
        return { total, window: windowFromRaw, entries };
    }

    async syncTimeFromDate(d: Date): Promise<void> {
        const y = d.getFullYear();
        const year7 = clamp(y - 2000, 0, 255);
        const month7 = clamp(d.getMonth(), 0, 11); // firmware expects 0..11
        const mday = clamp(d.getDate(), 1, 31);
        const hour = clamp(d.getHours(), 0, 23);
        const min = clamp(d.getMinutes(), 0, 59);
        const sec = clamp(d.getSeconds(), 0, 59);
        const wday = clamp(d.getDay(), 0, 6);
        const time7 = [year7, month7, mday, hour, min, sec, wday];
        await this.syncTimeRaw(time7);
    }

    async syncTimeRaw(time7: number[]): Promise<void> {
        if (!Array.isArray(time7) || time7.length !== 7) throw new Error("time7 must be array of 7 bytes");
        await this.writeCharacteristic(MACHHAR_SERVICE_UUID, MACHHAR_GADI_SYNC_UUID, time7.map((n) => clamp(n, 0, 255)));
    }

    async readSchedule(): Promise<ParsedSchedule> {
        const raw = await this.readCharacteristic(MACHHAR_SERVICE_UUID, MACHHAR_SCHEDULING_UUID);
        return this.parseSchedulePayload(raw);
    }

    async writeSchedule(entries: ScheduleEntry[]): Promise<void> {
        if (!Array.isArray(entries)) throw new Error("entries must be array");
        const count = clamp(entries.length, 0, 255);
        const payload: number[] = [count];
        for (let i = 0; i < count; i++) {
            const e = entries[i];
            if (!Array.isArray(e.time7) || e.time7.length !== 7) throw new Error(`entry[${i}].time7 must be 7 bytes`);
            const inten = e.intensity2b & 0x03;
            payload.push(...e.time7.map((n) => clamp(n, 0, 255)), inten);
        }
        await this.writeCharacteristic(MACHHAR_SERVICE_UUID, MACHHAR_SCHEDULING_UUID, payload);
    }

    async readStatistics(start: number, window: number): Promise<ParsedStats> {
        // write control then read
        const startB = clamp(start, 0, 255);
        const winB = clamp(window, 1, 63);
        await this.writeCharacteristic(MACHHAR_SERVICE_UUID, MACHHAR_STATISTICS_UUID, [startB, winB]);
        const raw = await this.readCharacteristic(MACHHAR_SERVICE_UUID, MACHHAR_STATISTICS_UUID);
        return this.parseStatsPayload(raw);
    }

    async testSpray(state: number = 0x01): Promise<void> {
        const b = [state & 0x03];
        await this.writeCharacteristic(MACHHAR_SERVICE_UUID, MACHHAR_REMOTE_SPRAY_UUID, b);
    }

    async getBatteryLevel(): Promise<number> {
        this.ensureConnected();
        try {
            const dv = await BleClient.read(this.connected.deviceId, BATTERY_SERVICE_UUID, BATTERY_LEVEL_UUID);
            const arr = dataViewToNumbers(dv);
            const level = arr[0] ?? 0;
            return clamp(level, 0, 100);
        } catch (err) {
            this.connected = null;
            this.notifyConnectionChange();
            throw err;
        }
    }

    private async readText(service: string, characteristic: string, fallback = "Unknown"): Promise<string> {
        this.ensureConnected();
        try {
            const dv = await BleClient.read(this.connected.deviceId, service, characteristic);
            const arr = dataViewToNumbers(dv);
            const str = String.fromCharCode(...arr).trim();
            return str || fallback;
        } catch {
            return fallback;
        }
    }

    async getDeviceInfo(): Promise<DeviceInfo> {
        return {
            modelNumber: await this.readText(DEVICE_INFORMATION_SERVICE_UUID, MODEL_NUMBER_UUID, "Machhar"),
            manufacturerName: await this.readText(DEVICE_INFORMATION_SERVICE_UUID, MANUFACTURER_NAME_UUID, "VeraShield"),
            serialNumber: await this.readText(DEVICE_INFORMATION_SERVICE_UUID, SERIAL_NUMBER_UUID, "Unknown"),
            firmwareRevision: await this.readText(DEVICE_INFORMATION_SERVICE_UUID, FIRMWARE_REVISION_UUID, "unknown"),
            hardwareRevision: await this.readText(DEVICE_INFORMATION_SERVICE_UUID, HARDWARE_REVISION_UUID, "unknown"),
            softwareRevision: await this.readText(DEVICE_INFORMATION_SERVICE_UUID, SOFTWARE_REVISION_UUID, "unknown"),
        };
    }
}

/* Export single instance */
export const bluetoothService: BluetoothService = new MachharBluetoothServiceImpl();
export default bluetoothService;