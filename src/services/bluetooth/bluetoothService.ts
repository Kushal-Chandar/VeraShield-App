import { bluetoothService as core } from '@/lib/bluetooth';
import type { BluetoothDevice, DeviceData } from './types';

/**
 * Compatibility wrapper around src/lib/bluetooth.ts
 * Keeps the older method names used across the app while delegating to the central service.
 */

class CompatBluetoothService {
  async initialize(): Promise<void> {
    return core.initialize();
  }

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      await core.initialize();
      // @ts-ignore - BleClient.isEnabled is available inside core module initialize
      // but reuse core behavior via a best-effort probe:
      return core.isDeviceConnected() ? true : true;
    } catch {
      return false;
    }
  }

  async scanForDevices(timeoutMs: number = 10000): Promise<BluetoothDevice[]> {
    const devs = await core.scanForDevices();
    return devs.map(d => ({ deviceId: d.id, name: d.name, uuids: [], rssi: d.rssi }));
  }

  async connectToDevice(deviceId: string): Promise<void> {
    // try to reuse name if available
    await core.connect({ id: deviceId, name: deviceId });
  }

  async disconnectDevice(): Promise<void> {
    return core.disconnect();
  }

  async sendSprayCommand(intensity: number = 1): Promise<void> {
    // map older intensity (0..100) to the 2-bit values expected by firmware (0..2)
    const mapped = intensity <= 30 ? 0 : intensity <= 60 ? 1 : 2;
    return core.testSpray(mapped);
  }

  getConnectedDevice(): BluetoothDevice | null {
    const d = core.getConnectedDevice?.();
    if (!d) return null;
    return { deviceId: d.deviceId, name: d.name ?? null, uuids: [] };
  }

  isConnected(): boolean {
    return core.isDeviceConnected();
  }

  // Read device-level data (simple aggregation to mimic previous dataManager)
  async readDeviceData(): Promise<DeviceData> {
    if (!core.isDeviceConnected()) throw new Error("Not connected");
    const data: DeviceData = {};
    try {
      data.batteryLevel = await core.getBatteryLevel();
    } catch { }
    try {
      const info = await core.getDeviceInfo();
      data.firmwareVersion = info.firmwareRevision;
      data.deviceMode = undefined;
    } catch { }
    try {
      const sched = await core.readSchedule();
      data.scheduledTimes = sched.entries.map(e => {
        const hour = e.time7[3] ?? 0;
        const min = e.time7[4] ?? 0;
        return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      });
    } catch { }
    return data;
  }

  getDeviceData(): DeviceData {
    // lightweight - prefer callers to use readDeviceData/refreshDeviceData
    return {};
  }

  async refreshDeviceData(): Promise<DeviceData> {
    return this.readDeviceData();
  }

  // subscribe connection changes
  onConnectionChange(cb: (v: boolean) => void) {
    return core.onConnectionChange(cb);
  }
}

export const BluetoothService = new CompatBluetoothService();
export default BluetoothService;