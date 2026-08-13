export type PlanStatus = 'ready' | 'ongoing' | 'start';

export interface ChecklistItem {
  label: string;
  detail?: string;
  done: boolean;
  expandable?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  reviewed: string;
  status: PlanStatus;
  checklist: ChecklistItem[];
}

export const PLANS: Plan[] = [
  {
    id: 'apartment-fire',
    name: 'Apartment fire',
    reviewed: '3 weeks ago',
    status: 'ready',
    checklist: [
      { label: 'Fire extinguisher checked and charged', done: true },
      { label: 'Escape route map posted near door', done: true },
      { label: 'Smoke detectors tested this month', done: true },
      { label: 'Meeting point agreed', detail: 'Apt 12B lobby', done: true },
      { label: 'Fire blanket stored in kitchen', done: true },
      { label: 'Emergency contacts printed and laminated', done: true },
      { label: "Fire warden briefed on Kai's mobility needs", done: true },
    ],
  },
  {
    id: 'flash-flood',
    name: 'Flash flood',
    reviewed: '2 months ago',
    status: 'ongoing',
    checklist: [
      { label: '3-day supply of water for 5 people', detail: '15 L total · current: 9 L', done: false, expandable: true },
      { label: 'Medication list with dosages', detail: 'Mum, Dad, Kai', done: true },
      { label: 'Photocopied ID for all family', detail: 'Stored in waterproof pouch', done: true },
      { label: 'Accessible evacuation route reviewed', detail: 'Step-free path to Level 2 car park confirmed', done: true },
      { label: 'Sandbags ready at entrance', detail: '2 bags stored in storage cage', done: true },
      { label: 'Battery-powered radio charged', detail: 'Spare batteries in go-bag', done: true },
      { label: 'Contact building manager about flood gates', done: false },
    ],
  },
  {
    id: 'typhoon',
    name: 'Typhoon',
    reviewed: 'Never',
    status: 'ongoing',
    checklist: [
      { label: 'Shutters and window protection installed', done: true },
      { label: 'Emergency kit restocked', detail: 'Batteries, torches', done: true },
      { label: 'Roof and gutters inspected', done: false },
      { label: 'Evacuation shelter location confirmed', done: false },
      { label: 'Car fuelled and packed', done: false },
      { label: 'Pet carrier and supplies ready', done: false },
    ],
  },
  {
    id: 'bushfire',
    name: 'Bushfire',
    reviewed: 'Never',
    status: 'start',
    checklist: [
      { label: 'Defendable space cleared around property', done: false },
      { label: 'Bushfire survival plan written', done: false },
      { label: 'Woollen blankets and goggles packed', done: false },
      { label: 'Battery radio tuned to emergency frequency', done: false },
      { label: 'Two evacuation routes identified', done: false },
      { label: 'Gutters cleared of leaves', done: false },
    ],
  },
];
