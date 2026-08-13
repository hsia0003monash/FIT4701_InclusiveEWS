export type PlanStatus = 'ready' | 'ongoing' | 'start';

export interface ChecklistItem {
  label: string;
  detail?: string;
  done: boolean;
  expandable?: boolean;
}

export interface ParticipantProgress {
  name: string;
  stepsDone: number;
}

export interface Plan {
  id: string;
  name: string;
  reviewed: string;
  status: PlanStatus;
  createdBy: string;
  participants: ParticipantProgress[];
  checklist: ChecklistItem[];
}

export function getPlanStats(plan: Plan) {
  const total = plan.checklist.length;
  const done = plan.checklist.filter((item) => item.done).length;
  const percent = Math.round((done / total) * 100);
  return { total, done, percent };
}

/** Progress-bar colour tone based on how far along a plan is, independent of its status label. */
export function getProgressTone(percent: number): 'emergency' | 'watch' | 'safe' {
  if (percent >= 90) return 'safe';
  if (percent >= 33) return 'watch';
  return 'emergency';
}

export const PLANS: Plan[] = [
  {
    id: 'apartment-fire',
    name: 'Apartment fire',
    reviewed: '3 weeks ago',
    status: 'ready',
    createdBy: 'You',
    participants: [
      { name: 'Mum', stepsDone: 7 },
      { name: 'Dad', stepsDone: 7 },
      { name: 'Kai', stepsDone: 6 },
      { name: 'Husband', stepsDone: 7 },
    ],
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
    createdBy: 'You',
    participants: [
      { name: 'Mum', stepsDone: 5 },
      { name: 'Dad', stepsDone: 4 },
      { name: 'Kai', stepsDone: 2 },
      { name: 'Husband', stepsDone: 6 },
    ],
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
    createdBy: 'You',
    participants: [
      { name: 'Mum', stepsDone: 2 },
      { name: 'Dad', stepsDone: 1 },
      { name: 'Kai', stepsDone: 0 },
      { name: 'Husband', stepsDone: 3 },
    ],
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
    createdBy: 'You',
    participants: [
      { name: 'Mum', stepsDone: 0 },
      { name: 'Dad', stepsDone: 0 },
      { name: 'Kai', stepsDone: 0 },
      { name: 'Husband', stepsDone: 1 },
    ],
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
