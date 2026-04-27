export interface HardwareHistory {
  date: string;
  field: string;
  oldValue: string;
  newValue: string;
  author: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'superadmin' | 'viewer';
  password?: string;
}

export interface Software {
  name: string;
  version: string;
  publisher?: string;
  installDate?: string;
}

export interface Computer {
  id: string;
  agentId?: string;
  groupId?: string;
  name: string;
  hostname?: string;
  model: string;
  manufacturer?: string;
  serialNumber: string;
  status: 'In Use' | 'Available' | 'Repair' | 'Retired';
  assignedTo: string;
  location: string;
  cpu: string;
  cpuCores?: number;
  ram: string;
  storage: string;
  gpu: string;
  motherboard?: string;
  os: string;
  lastIp: string;
  vncActive: boolean;
  purchaseDate?: string;
  createdAt: string;
  updatedAt?: string;
  lastSeen?: string;
  notes: string;
  history: HardwareHistory[];
  software: Software[];
}

export interface SyncLog {
  timestamp: string;
  action: string;
  payload: any;
}

export interface Settings {
  companyName: string;
  oneCBaseUrl: string;
  syncToken: string;
  vncPassword?: string;
  agentInterval?: number;
}
