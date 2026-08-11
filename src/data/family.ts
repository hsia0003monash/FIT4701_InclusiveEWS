export type FamilyStatus = 'safe' | 'checkIn';

export interface FamilyMember {
  id: string;
  name: string;
  age?: number;
  location: string;
  status: FamilyStatus;
  updated: string;
  message: string;
}

export const FAMILY: FamilyMember[] = [
  { id: 'mum', name: 'Mum', age: 76, location: 'Apt 12B', status: 'safe', updated: '12 min ago', message: "With Dad. Fine." },
  { id: 'dad', name: 'Dad', age: 78, location: 'Apt 12B', status: 'safe', updated: '12 min ago', message: "With Mum. Fine." },
  { id: 'kai', name: 'Kai', age: 8, location: 'St Kilda Primary', status: 'checkIn', updated: 'Not replied', message: 'School is in lockdown. Teacher has acknowledged.' },
  { id: 'husband', name: 'Husband', location: 'Work · Southbank', status: 'safe', updated: '1h ago', message: 'At the office. All clear.' },
];
