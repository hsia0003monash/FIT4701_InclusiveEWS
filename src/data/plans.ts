import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { HAZARD_STYLES, HazardType } from './hazards';

// ---------------------------------------------------------------------------
// Safe locations — a reusable pool. Plans reference these by id, or leave
// safeLocationId as null to fall back to whichever location is marked default.
// This keeps location entry a one-time task rather than something repeated
// per hazard, while still allowing a specific plan to point somewhere else
// (e.g. a flood plan pointing to nearby high ground instead of the default).
// ---------------------------------------------------------------------------

export interface SafeLocation {
  id: string;
  name: string;
  address: string;
  /** At most one location should have this set. */
  isDefault?: boolean;
  /** Resolved automatically from `address` via geocoding when the location is saved. */
  lat?: number;
  long?: number;
}

export const INITIAL_SAFE_LOCATIONS: SafeLocation[] = [
  {
    id: 'loc-parents',
    name: "Mum and Dad's place",
    address: '12 Smith St, Brunswick',
    isDefault: true,
    lat: -37.7666,
    long: 144.9599,
  },
  {
    id: 'loc-community',
    name: 'Northcote Community Centre',
    address: '45 High St, Northcote',
    lat: -37.7699,
    long: 144.9975,
  },
];

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

/** A plan is either tied to a specific hazard type, or 'General' — the fallback used for anything without its own plan. */
export type PlanHazardType = HazardType | 'General';

export interface EvacuationPlan {
  id: string;
  hazardType: PlanHazardType;
  title: string;
  steps: string[];
  /** References a SafeLocation.id. null means "use the default safe location". */
  safeLocationId: string | null;
  /** True once the user has edited a seeded default — enables "Reset to default". */
  isCustomized?: boolean;
}

// 'General' isn't a real hazard type, so it doesn't have a HAZARD_STYLES entry.
// Reuses Misc's neutral grey (rather than inventing a new colour) so it reads
// as "unspecific" without clashing with any real hazard's colour.
export const GENERAL_PLAN_ICON: keyof typeof MaterialCommunityIcons.glyphMap = 'shield-account-outline';
export const GENERAL_PLAN_THEME = HAZARD_STYLES.Misc.theme;

/** A resolved point handed off to MapScreen when the user asks for directions to a plan's safe location. */
export interface MapDestination {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Finds the plan matching a given hazard type, falling back to the General
 * plan if that specific type doesn't have its own. Used to link an active
 * hazard on Home/Map directly to its response plan.
 */
export function resolvePlanForHazardType(plans: EvacuationPlan[], hazardType: PlanHazardType): EvacuationPlan | null {
  return plans.find((p) => p.hazardType === hazardType) ?? plans.find((p) => p.hazardType === 'General') ?? null;
}

/**
 * Resolves a plan's effective destination (its own saved location, or
 * whichever location is marked default) into map coordinates. Returns null
 * if that location doesn't have resolved coordinates yet (e.g. an address
 * that failed to geocode).
 */
export function resolvePlanDestination(plan: EvacuationPlan, safeLocations: SafeLocation[]): MapDestination | null {
  const defaultLocation = safeLocations.find((l) => l.isDefault) ?? null;
  const loc = plan.safeLocationId ? safeLocations.find((l) => l.id === plan.safeLocationId) : defaultLocation;
  if (!loc || loc.lat === undefined || loc.long === undefined) return null;
  return { latitude: loc.lat, longitude: loc.long, name: loc.name };
}

export const INITIAL_PLANS: EvacuationPlan[] = [
  {
    id: 'plan-general',
    hazardType: 'General',
    title: 'General plan',
    steps: [
      'Stay calm and check the app for the latest information.',
      'Let your family know you are safe using the Family tab.',
      'Follow instructions from emergency services if given.',
      'Go to your nominated safe location if you need to leave.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-fire',
    hazardType: 'Fire',
    title: 'Fire plan',
    steps: [
      'Check which direction the fire is coming from.',
      'Close all windows and doors, and turn off gas.',
      'Wear protective clothing if you must go outside.',
      "Leave early via a clear route to your safe location — don't wait until you can see flames.",
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-chemical',
    hazardType: 'Chemical',
    title: 'Chemical incident plan',
    steps: [
      'Move indoors immediately and close all windows and doors.',
      'Turn off air conditioning and any outside air intake.',
      'Cover gaps under doors with a wet towel.',
      'Wait for official advice before leaving — do not evacuate through the affected area.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-thunderstorm',
    hazardType: 'Thunderstorm',
    title: 'Thunderstorm plan',
    steps: [
      'Unplug electrical appliances.',
      'Stay indoors and away from windows.',
      'Move vehicles under cover if safe to do so.',
      'Avoid using a corded phone during lightning.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-storm',
    hazardType: 'Storm',
    title: 'Storm plan',
    steps: [
      'Secure or bring in loose outdoor items.',
      'Stay indoors, away from windows and trees.',
      'Charge your phone and keep it nearby.',
      'Move to your safe location if flooding or damage makes your home unsafe.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-cyclone',
    hazardType: 'Cyclone',
    title: 'Cyclone plan',
    steps: [
      'Bring in outdoor furniture and secure loose items.',
      'Fill containers with drinking water in case supply is cut.',
      'Stay indoors in the strongest part of the house, away from windows.',
      'Follow official advice on when it is safe to leave.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-extreme-winds',
    hazardType: 'Extreme winds',
    title: 'Extreme winds plan',
    steps: [
      'Secure or bring in loose outdoor items.',
      'Stay indoors and away from trees and power lines.',
      'Avoid driving unless necessary.',
      'Report fallen power lines — do not go near them.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-earthquake',
    hazardType: 'Earthquake',
    title: 'Earthquake plan',
    steps: [
      'Drop, cover, and hold on where you are.',
      'Stay away from windows, glass, and heavy furniture.',
      'If outdoors, move to open ground away from buildings.',
      'After shaking stops, check for gas leaks and damage before moving.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-flooding',
    hazardType: 'Flooding',
    title: 'Flooding plan',
    steps: [
      'Move valuables and furniture to higher ground.',
      'Turn off electricity and gas if water is rising.',
      'Do not walk or drive through floodwater.',
      'Move to higher ground or your safe location before roads are cut.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-tsunami',
    hazardType: 'Tsunami',
    title: 'Tsunami plan',
    steps: [
      'Move immediately to higher ground, inland or upstairs.',
      'Do not wait for an official warning if you feel strong shaking or see the sea recede suddenly.',
      'Stay away from the coast until officially told it is safe.',
      'Head to your safe location if it is on high ground.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-landslide',
    hazardType: 'Landslide',
    title: 'Landslide plan',
    steps: [
      'Move away from the slope, not across it.',
      'Listen for unusual sounds like cracking trees or rumbling ground.',
      'Leave the area immediately if you notice new cracks or ground movement.',
      'Head to your safe location on stable, flat ground.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-heatwave',
    hazardType: 'Heatwave',
    title: 'Heatwave plan',
    steps: [
      'Stay indoors during the hottest part of the day.',
      'Drink water regularly, even if not thirsty.',
      'Check on family members and neighbours who may be vulnerable.',
      'Go to an air-conditioned safe location if your home is unbearably hot.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-gas-leak',
    hazardType: 'Gas leak',
    title: 'Gas leak plan',
    steps: [
      'Do not use switches, phones, or anything that could spark.',
      'Turn off the gas supply at the meter if it is safe to do so.',
      'Open doors and windows on your way out.',
      'Leave the area and go to your safe location, then call for help once at a safe distance.',
    ],
    safeLocationId: null,
  },
  {
    id: 'plan-air-quality',
    hazardType: 'Air quality',
    title: 'Air quality plan',
    steps: [
      'Stay indoors and close windows and doors.',
      'Turn off air conditioning that draws in outside air.',
      'Wear a well-fitted mask if you must go outside.',
      'Move to your safe location if indoor air quality is also poor.',
    ],
    safeLocationId: null,
  },
];
