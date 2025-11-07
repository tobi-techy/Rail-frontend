// ============= Device Management Types =============

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'web' | 'desktop';
  os: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface GetDevicesResponse {
  devices: Device[];
}

export interface RemoveDeviceRequest {
  deviceId: string;
}
