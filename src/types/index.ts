export type PortStatus = 'Available' | 'In Use' | 'Listening';

export interface Port {
  id: number;
  status: PortStatus;
  protocol: 'TCP' | 'UDP';
  process: string | null;
  cpu: string | null;
  memory: string | null;
}
