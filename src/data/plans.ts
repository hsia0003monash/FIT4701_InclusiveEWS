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
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

// Bold, saturated colours dedicated to the progress-bar fill. The severity palette's
// `fg` tones are tuned for text contrast and read as near-identical dark shades at this
// size, so the fill itself needs its own vivid set instead of reusing them.
const PROGRESS_FILL = {
  notStarted: '#DC2626',
  inProgress: '#D97706',
  nearComplete: '#16A34A',
};

/** Progress-bar fill colour based on how far along a plan is, independent of its status label. */
export function getProgressFillColor(percent: number): string {
  if (percent >= 90) return PROGRESS_FILL.nearComplete;
  if (percent >= 33) return PROGRESS_FILL.inProgress;
  return PROGRESS_FILL.notStarted;
}

/** Minimum visible fill width so a 0% plan still shows its colour instead of an empty bar. */
export function getProgressFillWidth(percent: number): number {
  return Math.max(percent, 6);
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

/** A ready-made plan template for a common emergency. */
export interface PlanPreset {
  id: string;
  name: string;
  /** Ionicons name shown on the preset card. */
  icon: string;
  /** One-line description of when this plan applies. */
  description: string;
  /** Where the recommended tasks are drawn from (shown as attribution). */
  source: string;
  /** Recommended preparation tasks (all start unchecked when the plan is created). */
  tasks: string[];
}

/**
 * Preset preparation plans for common emergencies.
 *
 * The recommended tasks are paraphrased (not copied verbatim) from Australian emergency
 * authorities and adapted into short, plain-language checklist items:
 *  - Australian Red Cross "RediPlan" household preparedness (be informed, make a plan,
 *    build an emergency kit, know your neighbours).
 *  - CFA Bushfire Survival Plan (VIC) and NSW RFS bush fire survival planning.
 *  - VICSES / Australian Institute for Disaster Resilience flood and storm guidance.
 * These are general preparedness prompts, not official advice — users should always
 * follow current warnings from local emergency services.
 */
export const PLAN_PRESETS: PlanPreset[] = [
  {
    id: 'preset-bushfire',
    name: 'Bushfire',
    icon: 'flame',
    description: 'For homes near bush, grass or forest.',
    source: 'Adapted from CFA Bushfire Survival Plan & NSW RFS',
    tasks: [
      'Decide your trigger to leave — leave early on high-risk days',
      'Agree two ways out of your area in case one is blocked',
      'Clear leaves, bark and rubbish from around the house and gutters',
      'Pack a go-bag: water, medications, phone charger, important papers',
      'Store wool blankets and protective clothing where you can grab them',
      'Set your radio/app to local emergency broadcasts',
      'Confirm where pets and livestock will go',
    ],
  },
  {
    id: 'preset-flood',
    name: 'Flash flood',
    icon: 'water',
    description: 'For heavy rain, rivers and low-lying areas.',
    source: 'Adapted from VICSES & Australian Red Cross RediPlan',
    tasks: [
      'Know your safest route to higher ground',
      'Never drive, walk or ride through floodwater',
      'Move valuables and electrical items up high',
      'Prepare sandbags or barriers for doorways if provided',
      'Keep a 3-day supply of water and food',
      'Store ID and documents in a waterproof pouch',
      'Charge phones and a battery radio; keep spare batteries',
    ],
  },
  {
    id: 'preset-storm',
    name: 'Severe storm',
    icon: 'thunderstorm',
    description: 'For damaging winds, hail and heavy rain.',
    source: 'Adapted from VICSES storm safety guidance',
    tasks: [
      'Secure or bring in loose outdoor items',
      'Check and clear gutters and downpipes',
      'Trim branches that could fall on the house',
      'Know how to safely turn off power, water and gas',
      'Keep a torch and battery radio ready',
      'Stay inside and away from windows during the storm',
    ],
  },
  {
    id: 'preset-heatwave',
    name: 'Heatwave',
    icon: 'sunny',
    description: 'For extreme heat, especially for older people.',
    source: 'Adapted from Australian Red Cross & health authorities',
    tasks: [
      'Drink water regularly — do not wait until thirsty',
      'Plan cool places to go (library, shopping centre)',
      'Check air-conditioning or fans work before hot days',
      'Keep blinds and curtains closed during the day',
      'Check on elderly relatives and neighbours daily',
      'Store medicines correctly in the heat',
    ],
  },
  {
    id: 'preset-house-fire',
    name: 'House / apartment fire',
    icon: 'home',
    description: 'For fire inside the home or building.',
    source: 'Adapted from fire service home fire safety advice',
    tasks: [
      'Test smoke alarms and replace flat batteries',
      'Agree an escape route and a backup route',
      'Pick a safe meeting point outside',
      'Keep exits and hallways clear of clutter',
      'Practise the escape plan with everyone at home',
      'Know how to call 000 and give your address',
    ],
  },
  {
    id: 'preset-earthquake',
    name: 'Earthquake',
    icon: 'pulse',
    description: 'For sudden ground shaking.',
    source: 'Adapted from Australian Red Cross RediPlan',
    tasks: [
      'Learn Drop, Cover and Hold On',
      'Secure heavy furniture and shelves to walls',
      'Identify safe spots in each room (under sturdy tables)',
      'Keep sturdy shoes and a torch by the bed',
      'Store a first-aid kit and emergency water',
      'Know how to turn off gas, water and power',
    ],
  },
  {
    id: 'preset-cyclone',
    name: 'Cyclone / typhoon',
    icon: 'cloudy',
    description: 'For tropical storms with destructive winds.',
    source: 'Adapted from Australian Red Cross & state emergency services',
    tasks: [
      'Know your evacuation zone and shelter options',
      'Fit or prepare window and door protection',
      'Store loose outdoor items before the season',
      'Build an emergency kit with 3 days of supplies',
      'Keep vehicles fuelled and ready to move',
      'Prepare pet carriers and pet supplies',
      'Fill clean containers with drinking water',
    ],
  },
];

/**
 * Turn a preset into a real, editable plan for the user's list. All tasks start
 * unchecked and the plan is attributed to the user.
 */
export function createPlanFromPreset(preset: PlanPreset): Plan {
  return {
    id: `${preset.id}-${Date.now()}`,
    name: preset.name,
    reviewed: 'Just now',
    status: 'start',
    createdBy: 'You',
    participants: [],
    checklist: preset.tasks.map((label) => ({ label, done: false })),
  };
}

/** Create an empty custom plan the user can add their own tasks to. */
export function createBlankPlan(name: string): Plan {
  return {
    id: `custom-${Date.now()}`,
    name: name.trim() || 'My plan',
    reviewed: 'Just now',
    status: 'start',
    createdBy: 'You',
    participants: [],
    checklist: [],
  };
}
