

export type PortStatus = 'Available' | 'In Use' | 'Listening';

export interface Port {
  id: number;
  status: PortStatus;
  protocol: 'TCP' | 'UDP';
  process: string | null;
  cpu: string | null;
  memory: string | null;
}

export interface Skill {
    name: string;
    isPrimary: boolean;
}

export interface AppUser {
  id: string;
  displayName: string | null;
  photoURL: string | null;
  email?: string | null;
  college?: string;
  status?: 'seeking' | 'active' | 'none';
  skills?: Skill[];
  instagram?: string;
  github?: string;
  linkedin?: string;
  otherLink?: string;
}
