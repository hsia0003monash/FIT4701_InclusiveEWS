import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { RButton } from '../components/RButton';
import { RCard } from '../components/RCard';
import { RCenteredOverlay } from '../components/RCenteredOverlay';
import { RFormField } from '../components/RFormField';
import { RText } from '../components/RText';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme/useTheme';
import { HAZARD_STYLES, HazardType, toRgba } from '../data/hazards';
import {
  EvacuationPlan,
  GENERAL_PLAN_ICON,
  GENERAL_PLAN_THEME,
  INITIAL_PLANS,
  MapDestination,
  PlanHazardType,
  resolvePlanDestination,
  SafeLocation,
} from '../data/plans';

interface PlansScreenProps {
  plans: EvacuationPlan[];
  onUpdatePlans: (plans: EvacuationPlan[]) => void;
  safeLocations: SafeLocation[];
  onUpdateSafeLocations: (locations: SafeLocation[]) => void;
  onNavigateToLocation: (destination: MapDestination) => void;
  /** Set by App.tsx when the user tapped "View plan" on Home/Map for a
   * specific hazard — opens that plan's detail view automatically on arrival. */
  initialPlanId?: string | null;
  onInitialPlanHandled?: () => void;
}

// Same key used for Directions in MapScreen — also needs the Places API
// enabled on the same Google Cloud project. When unset, the address field
// falls back to plain typed entry, geocoded on save via the device's native
// geocoder (Location.geocodeAsync) rather than any Google API.
const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

interface AddressSuggestion {
  placeId: string;
  description: string;
}

// Groups a sequence of autocomplete keystroke requests plus the final Place
// Details lookup into one billed "session" instead of charging per request —
// generated fresh each time the address field starts being edited.
function generateSessionToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

type OverlayKind = 'location' | 'plan' | 'picker' | null;

function getPlanStyle(hazardType: PlanHazardType) {
  if (hazardType === 'General') {
    return { icon: GENERAL_PLAN_ICON, theme: GENERAL_PLAN_THEME };
  }
  return HAZARD_STYLES[hazardType];
}

function resolveLocationLabel(
  plan: EvacuationPlan,
  safeLocations: SafeLocation[],
  defaultLocation: SafeLocation | null
): string {
  if (plan.safeLocationId) {
    const loc = safeLocations.find((l) => l.id === plan.safeLocationId);
    return loc ? loc.name : 'Saved location removed — using default';
  }
  return defaultLocation ? `Default: ${defaultLocation.name}` : 'No default location set';
}

// ---------------------------------------------------------------------------
// A flat, single-select list of safe locations for the plan edit form.
// "Use default" is always the first option, matching the "one decision, one
// screen" preference for low-tech-literacy users — no separate picker screen.
// ---------------------------------------------------------------------------
function LocationSelector({
  locations,
  defaultLocation,
  value,
  onChange,
  theme,
}: {
  locations: SafeLocation[];
  defaultLocation: SafeLocation | null;
  value: string | null;
  onChange: (id: string | null) => void;
  theme: Theme;
}) {
  const { colors, spacing, radius, sizing } = theme;

  const renderOption = (
    key: string,
    selected: boolean,
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    onPress: () => void
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.locationOption,
        {
          minHeight: sizing.touchTarget.preferredPrimary,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.cardPadding,
          gap: spacing.scale[3],
          backgroundColor: selected ? colors.surface2 : colors.surface,
          borderColor: selected ? colors.ink : colors.hairline,
        },
      ]}
    >
      <Ionicons name={icon} size={sizing.icon.medium} color={selected ? colors.ink : colors.ink3} />
      <View style={{ flex: 1 }}>
        <RText variant="bodyEmphasis" color={colors.ink}>
          {title}
        </RText>
        <RText variant="caption" color={colors.ink3}>
          {subtitle}
        </RText>
      </View>
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.scale[3] }}>
      {renderOption(
        'default',
        value === null,
        'star',
        'Use default location',
        defaultLocation ? defaultLocation.name : 'No default set',
        () => onChange(null)
      )}
      {locations.map((loc) =>
        renderOption(
          loc.id,
          value === loc.id,
          loc.isDefault ? 'star' : 'location',
          loc.name,
          loc.address,
          () => onChange(loc.id)
        )
      )}
    </View>
  );
}

export function PlansScreen({
  plans,
  onUpdatePlans,
  safeLocations,
  onUpdateSafeLocations,
  onNavigateToLocation,
  initialPlanId,
  onInitialPlanHandled,
}: PlansScreenProps) {
  const theme = useTheme();
  const { colors, spacing, radius, sizing } = theme;

  const defaultLocation = safeLocations.find((l) => l.isDefault) ?? null;

  const orderedHazardTypes = Object.keys(HAZARD_STYLES) as HazardType[];
  const plannedTypes = new Set(plans.map((p) => p.hazardType));
  const unplannedTypes = orderedHazardTypes.filter((t) => !plannedTypes.has(t));

  const sortedPlans = [...plans].sort((a, b) => {
    if (a.hazardType === 'General') return -1;
    if (b.hazardType === 'General') return 1;
    return (
      orderedHazardTypes.indexOf(a.hazardType as HazardType) - orderedHazardTypes.indexOf(b.hazardType as HazardType)
    );
  });

  const [activeOverlay, setActiveOverlay] = useState<OverlayKind>(null);

  // Safe location form state
  const [locationMode, setLocationMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedLocation, setSelectedLocation] = useState<SafeLocation | null>(null);
  const [draftLocName, setDraftLocName] = useState('');
  const [draftLocAddress, setDraftLocAddress] = useState('');
  const [draftLocLat, setDraftLocLat] = useState<number | undefined>(undefined);
  const [draftLocLong, setDraftLocLong] = useState<number | undefined>(undefined);
  const [confirmingRemoveLocation, setConfirmingRemoveLocation] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [placesSessionToken, setPlacesSessionToken] = useState<string | null>(null);

  // Plan form state
  const [planMode, setPlanMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedPlan, setSelectedPlan] = useState<EvacuationPlan | null>(null);
  const [draftPlanHazardType, setDraftPlanHazardType] = useState<PlanHazardType>('Misc');
  const [draftPlanTitle, setDraftPlanTitle] = useState('');
  const [draftPlanSteps, setDraftPlanSteps] = useState('');
  const [draftPlanLocationId, setDraftPlanLocationId] = useState<string | null>(null);

  const closeOverlay = () => {
    setActiveOverlay(null);
    setConfirmingRemoveLocation(false);
  };

  // --- Safe location handlers -----------------------------------------

  const openViewLocation = (location: SafeLocation) => {
    setConfirmingRemoveLocation(false);
    setSelectedLocation(location);
    setLocationMode('view');
    setActiveOverlay('location');
  };

  const openEditLocation = (location: SafeLocation) => {
    setConfirmingRemoveLocation(false);
    setSelectedLocation(location);
    setDraftLocName(location.name);
    setDraftLocAddress(location.address);
    setDraftLocLat(location.lat);
    setDraftLocLong(location.long);
    setAddressSuggestions([]);
    setPlacesSessionToken(null);
    setLocationMode('edit');
    setActiveOverlay('location');
  };

  const openAddLocation = () => {
    setConfirmingRemoveLocation(false);
    setSelectedLocation(null);
    setDraftLocName('');
    setDraftLocAddress('');
    setDraftLocLat(undefined);
    setDraftLocLong(undefined);
    setAddressSuggestions([]);
    setPlacesSessionToken(null);
    setLocationMode('add');
    setActiveOverlay('location');
  };

  // Debounced address autocomplete — waits for a short pause in typing before
  // firing a request, and only while the location form is actually open.
  useEffect(() => {
    if (!GOOGLE_PLACES_KEY) return;
    if (activeOverlay !== 'location' || (locationMode !== 'add' && locationMode !== 'edit')) return;

    const query = draftLocAddress.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const token = placesSessionToken ?? generateSessionToken();
    if (!placesSessionToken) setPlacesSessionToken(token);

    const timeout = setTimeout(async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_PLACES_KEY}&sessiontoken=${token}&components=country:au`;
        const response = await fetch(url);
        const data = await response.json();
        setAddressSuggestions(
          (data.predictions ?? []).map((p: any) => ({ placeId: p.place_id, description: p.description }))
        );
      } catch (err) {
        console.error('Address autocomplete request failed:', err);
        setAddressSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [draftLocAddress, activeOverlay, locationMode]);

  const handleAddressChange = (text: string) => {
    setDraftLocAddress(text);
    // A manual edit invalidates any coordinates captured from a prior
    // suggestion pick — handleSaveLocation falls back to geocoding on save.
    setDraftLocLat(undefined);
    setDraftLocLong(undefined);
  };

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    setDraftLocAddress(suggestion.description);
    setAddressSuggestions([]);
    if (!GOOGLE_PLACES_KEY) return;

    try {
      const token = placesSessionToken ?? generateSessionToken();
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.placeId}&fields=geometry&key=${GOOGLE_PLACES_KEY}&sessiontoken=${token}`;
      const response = await fetch(url);
      const data = await response.json();
      const location = data.result?.geometry?.location;
      if (location) {
        setDraftLocLat(location.lat);
        setDraftLocLong(location.lng);
      }
    } catch (err) {
      console.error('Place details request failed:', err);
    } finally {
      setPlacesSessionToken(null); // session ends once a place is picked
    }
  };

  const handleSaveLocation = async () => {
    const name = draftLocName.trim();
    const address = draftLocAddress.trim();
    if (!name || !address) return;

    setIsSavingLocation(true);
    let lat = draftLocLat;
    let long = draftLocLong;

    // No precise coordinates yet (user typed freely without picking a
    // suggestion, or Places isn't configured) — fall back to the device's
    // native geocoder, same as before.
    if (lat === undefined || long === undefined) {
      try {
        const results = await Location.geocodeAsync(address);
        if (results[0]) {
          lat = results[0].latitude;
          long = results[0].longitude;
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
      }
    }
    setIsSavingLocation(false);

    if (locationMode === 'add') {
      const newLocation: SafeLocation = {
        id: `loc-${Date.now()}`,
        name,
        address,
        isDefault: safeLocations.length === 0, // first location added becomes the default automatically
        lat,
        long,
      };
      onUpdateSafeLocations([...safeLocations, newLocation]);
    } else if (locationMode === 'edit' && selectedLocation) {
      onUpdateSafeLocations(
        safeLocations.map((l) =>
          l.id === selectedLocation.id
            ? { ...l, name, address, lat: lat ?? l.lat, long: long ?? l.long } // keep prior coords if nothing new was found
            : l
        )
      );
    }
    closeOverlay();
  };

  const handleSetDefaultLocation = (location: SafeLocation) => {
    onUpdateSafeLocations(safeLocations.map((l) => ({ ...l, isDefault: l.id === location.id })));
  };

  const handleRemoveLocation = (location: SafeLocation) => {
    if (!confirmingRemoveLocation) {
      setConfirmingRemoveLocation(true);
      return;
    }
    onUpdateSafeLocations(safeLocations.filter((l) => l.id !== location.id));
    // Any plan pointing directly at this location falls back to the default
    // rather than being left with a dangling reference.
    onUpdatePlans(plans.map((p) => (p.safeLocationId === location.id ? { ...p, safeLocationId: null } : p)));
    closeOverlay();
  };

  // --- Plan handlers -----------------------------------------------------

  const openViewPlan = (plan: EvacuationPlan) => {
    setSelectedPlan(plan);
    setPlanMode('view');
    setActiveOverlay('plan');
  };

  // Arriving here from a "View plan" tap on Home/Map — open that specific
  // plan immediately rather than leaving the user to find it in the list.
  useEffect(() => {
    if (!initialPlanId) return;
    const plan = plans.find((p) => p.id === initialPlanId);
    if (plan) {
      openViewPlan(plan);
    }
    onInitialPlanHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanId]);

  const openEditPlan = (plan: EvacuationPlan) => {
    setSelectedPlan(plan);
    setDraftPlanHazardType(plan.hazardType);
    setDraftPlanTitle(plan.title);
    setDraftPlanSteps(plan.steps.join('\n'));
    setDraftPlanLocationId(plan.safeLocationId);
    setPlanMode('edit');
    setActiveOverlay('plan');
  };

  const openPicker = () => {
    setActiveOverlay('picker');
  };

  const openAddPlan = (hazardType: PlanHazardType) => {
    setSelectedPlan(null);
    setDraftPlanHazardType(hazardType);
    setDraftPlanTitle(hazardType === 'General' ? 'General plan' : `${hazardType} plan`);
    setDraftPlanSteps('');
    setDraftPlanLocationId(null);
    setPlanMode('add');
    setActiveOverlay('plan');
  };

  const handleSavePlan = () => {
    const title = draftPlanTitle.trim();
    const steps = draftPlanSteps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!title || steps.length === 0) return;

    if (planMode === 'add') {
      const newPlan: EvacuationPlan = {
        id: `plan-${Date.now()}`,
        hazardType: draftPlanHazardType,
        title,
        steps,
        safeLocationId: draftPlanLocationId,
        isCustomized: true,
      };
      onUpdatePlans([...plans, newPlan]);
    } else if (planMode === 'edit' && selectedPlan) {
      onUpdatePlans(
        plans.map((p) =>
          p.id === selectedPlan.id
            ? { ...p, title, steps, safeLocationId: draftPlanLocationId, isCustomized: true }
            : p
        )
      );
    }
    closeOverlay();
  };

  const handleResetPlan = (plan: EvacuationPlan) => {
    const original = INITIAL_PLANS.find((p) => p.hazardType === plan.hazardType);
    if (!original) return;
    onUpdatePlans(
      plans.map((p) =>
        p.id === plan.id
          ? { ...p, title: original.title, steps: original.steps, safeLocationId: original.safeLocationId, isCustomized: false }
          : p
      )
    );
    closeOverlay();
  };

  const planHasDefault = selectedPlan ? INITIAL_PLANS.some((p) => p.hazardType === selectedPlan.hazardType) : false;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <RText variant="eyebrowLabel" color={colors.ink3}>
                PLANS
              </RText>
              <View style={styles.locationRow}>
                <Ionicons name="document-text" size={16} color={colors.ink} />
                <RText variant="bodyEmphasis" color={colors.ink}>
                  {plans.length} plans ready
                </RText>
              </View>
            </View>
            <View
              style={[styles.avatar, { backgroundColor: colors.ink, borderColor: colors.hairline }]}
              accessibilityRole="button"
              accessibilityLabel="Your profile"
            >
              <RText variant="secondary" color={colors.bg}>
                SL
              </RText>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              Safe locations
            </RText>
          </View>

          <RCard padded={false}>
            {safeLocations.length === 0 ? (
              <View style={styles.emptyState}>
                <RText variant="secondary" color={colors.ink3}>
                  No safe locations yet.
                </RText>
              </View>
            ) : (
              safeLocations.map((location, index) => (
                <Pressable
                  key={location.id}
                  onPress={() => openViewLocation(location)}
                  accessibilityRole="button"
                  accessibilityLabel={`${location.name}${location.isDefault ? ', default location' : ''}`}
                  style={[
                    styles.locationRowItem,
                    index < safeLocations.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                  ]}
                >
                  <View style={[styles.locationIcon, { backgroundColor: colors.surface2 }]}>
                    <Ionicons name={location.isDefault ? 'star' : 'location'} size={20} color={colors.ink2} />
                  </View>
                  <View style={styles.locationInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {location.name}
                    </RText>
                    <RText variant="secondary" color={colors.ink3}>
                      {location.address}
                    </RText>
                  </View>
                  {location.isDefault && (
                    <RText variant="caption" color={colors.ink3}>
                      Default
                    </RText>
                  )}
                </Pressable>
              ))
            )}
          </RCard>

          <RButton
            label="Add safe location"
            variant="secondary"
            size="l"
            icon="add-circle-outline"
            iconPosition="leading"
            onPress={openAddLocation}
          />

          <View style={styles.sectionHeaderRow}>
            <RText variant="sectionHeading" color={colors.ink}>
              Your plans
            </RText>
          </View>

          <RCard padded={false}>
            {sortedPlans.map((plan, index) => {
              const style = getPlanStyle(plan.hazardType);
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => openViewPlan(plan)}
                  accessibilityRole="button"
                  accessibilityLabel={plan.title}
                  style={[
                    styles.planRow,
                    index < sortedPlans.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
                  ]}
                >
                  <View
                    style={[
                      styles.planIcon,
                      { width: sizing.avatar.medium, height: sizing.avatar.medium, borderRadius: sizing.avatar.medium / 2, backgroundColor: toRgba(style.theme, 1) },
                    ]}
                  >
                    <MaterialCommunityIcons name={style.icon} size={sizing.icon.medium} color="white" />
                  </View>
                  <View style={styles.planInfo}>
                    <RText variant="bodyEmphasis" color={colors.ink}>
                      {plan.title}
                    </RText>
                    <RText variant="secondary" color={colors.ink3}>
                      {resolveLocationLabel(plan, safeLocations, defaultLocation)}
                    </RText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
                </Pressable>
              );
            })}
          </RCard>

          {unplannedTypes.length > 0 && (
            <RButton
              label="Add plan"
              variant="secondary"
              size="l"
              icon="add-circle-outline"
              iconPosition="leading"
              onPress={openPicker}
            />
          )}
        </ScrollView>

        {/* Safe location overlay: view / edit / add */}
        {activeOverlay === 'location' && (
          <RCenteredOverlay
            title={locationMode === 'add' ? 'Add safe location' : locationMode === 'edit' ? 'Edit location' : selectedLocation?.name ?? 'Location'}
            onDismiss={closeOverlay}
          >
            {locationMode === 'view' && selectedLocation && (
              <>
                <RText variant="body" color={colors.ink2}>
                  {selectedLocation.address}
                </RText>

                {selectedLocation.lat === undefined && (
                  <RText variant="caption" color={colors.ink3}>
                    No coordinates found for this address — directions won't be available until it's edited with a
                    more specific address.
                  </RText>
                )}

                {selectedLocation.isDefault ? (
                  <View style={[styles.defaultBadge, { borderRadius: radius.pill, paddingHorizontal: spacing.scale[4], paddingVertical: spacing.scale[1], backgroundColor: colors.surface2 }]}>
                    <Ionicons name="star" size={sizing.icon.small} color={colors.ink2} />
                    <RText variant="caption" color={colors.ink2}>
                      Default location
                    </RText>
                  </View>
                ) : (
                  <RButton
                    label="Set as default"
                    variant="secondary"
                    size="m"
                    icon="star-outline"
                    iconPosition="leading"
                    onPress={() => handleSetDefaultLocation(selectedLocation)}
                  />
                )}

                <RButton
                  label="Edit"
                  variant="primary"
                  size="l"
                  icon="create-outline"
                  iconPosition="leading"
                  onPress={() => openEditLocation(selectedLocation)}
                />

                <RButton
                  label={confirmingRemoveLocation ? 'Tap again to confirm' : 'Remove location'}
                  variant="danger"
                  size="l"
                  icon="trash-outline"
                  iconPosition="leading"
                  onPress={() => handleRemoveLocation(selectedLocation)}
                />
              </>
            )}

            {(locationMode === 'edit' || locationMode === 'add') && (
              <>
                <RFormField label="Name" value={draftLocName} onChangeText={setDraftLocName} placeholder="e.g. Mum and Dad's place" />

                <View style={styles.addressFieldWrapper}>
                  <RFormField
                    label="Address"
                    value={draftLocAddress}
                    onChangeText={handleAddressChange}
                    placeholder="e.g. 12 Smith St, Brunswick"
                  />
                  {addressSuggestions.length > 0 && (
                    <View
                      style={[
                        styles.suggestionsList,
                        { backgroundColor: colors.surface, borderColor: colors.hairline, borderRadius: radius.md },
                      ]}
                    >
                      {addressSuggestions.map((suggestion, index) => (
                        <Pressable
                          key={suggestion.placeId}
                          onPress={() => handleSelectSuggestion(suggestion)}
                          accessibilityRole="button"
                          accessibilityLabel={suggestion.description}
                          style={[
                            styles.suggestionRow,
                            index < addressSuggestions.length - 1 && {
                              borderBottomWidth: 1,
                              borderBottomColor: colors.hairline,
                            },
                          ]}
                        >
                          <Ionicons name="location-outline" size={sizing.icon.small} color={colors.ink3} />
                          <RText variant="secondary" color={colors.ink} style={{ flex: 1 }}>
                            {suggestion.description}
                          </RText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <RButton
                  label={isSavingLocation ? 'Finding location…' : locationMode === 'add' ? 'Add location' : 'Save changes'}
                  variant="primary"
                  size="l"
                  icon="checkmark"
                  iconPosition="leading"
                  onPress={handleSaveLocation}
                />
              </>
            )}
          </RCenteredOverlay>
        )}

        {/* Hazard type picker for adding a new plan */}
        {activeOverlay === 'picker' && (
          <RCenteredOverlay title="Choose a hazard" onDismiss={closeOverlay}>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.scale[3] }}>
                {unplannedTypes.map((type) => {
                  const style = HAZARD_STYLES[type];
                  return (
                    <Pressable
                      key={type}
                      onPress={() => openAddPlan(type)}
                      accessibilityRole="button"
                      accessibilityLabel={type}
                      style={[
                        styles.pickerOption,
                        {
                          minHeight: sizing.touchTarget.preferredPrimary,
                          borderRadius: radius.lg,
                          paddingHorizontal: spacing.cardPadding,
                          gap: spacing.scale[3],
                          borderColor: colors.hairline,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.pickerIcon,
                          { width: sizing.avatar.medium, height: sizing.avatar.medium, borderRadius: sizing.avatar.medium / 2, backgroundColor: toRgba(style.theme, 1) },
                        ]}
                      >
                        <MaterialCommunityIcons name={style.icon} size={sizing.icon.medium} color="white" />
                      </View>
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {type}
                      </RText>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </RCenteredOverlay>
        )}

        {/* Plan overlay: view / edit / add */}
        {activeOverlay === 'plan' && (
          <RCenteredOverlay
            title={
              planMode === 'add'
                ? draftPlanTitle || 'New plan'
                : planMode === 'edit'
                ? 'Edit plan'
                : selectedPlan?.title ?? 'Plan'
            }
            onDismiss={closeOverlay}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.scale[4] }}>
                {planMode === 'view' && selectedPlan && (
                  <>
                    <RText variant="secondary" color={colors.ink3}>
                      {resolveLocationLabel(selectedPlan, safeLocations, defaultLocation)}
                    </RText>

                    <View style={{ gap: spacing.scale[2] }}>
                      {selectedPlan.steps.map((step, i) => (
                        <View key={i} style={{ flexDirection: 'row', gap: spacing.scale[2] }}>
                          <RText variant="bodyEmphasis" color={colors.ink3}>
                            {i + 1}.
                          </RText>
                          <RText variant="body" color={colors.ink2} style={{ flex: 1 }}>
                            {step}
                          </RText>
                        </View>
                      ))}
                    </View>

                    {(() => {
                      const destination = resolvePlanDestination(selectedPlan, safeLocations);
                      return destination ? (
                        <RButton
                          label={`Show directions to ${destination.name}`}
                          variant="primary"
                          size="l"
                          icon="navigate"
                          iconPosition="leading"
                          onPress={() => {
                            onNavigateToLocation(destination);
                            closeOverlay();
                          }}
                        />
                      ) : (
                        <RText variant="caption" color={colors.ink3}>
                          Directions unavailable — the safe location for this plan doesn't have a saved position yet.
                        </RText>
                      );
                    })()}

                    <RButton
                      label="Edit"
                      variant="secondary"
                      size="l"
                      icon="create-outline"
                      iconPosition="leading"
                      onPress={() => openEditPlan(selectedPlan)}
                    />

                    {selectedPlan.isCustomized && planHasDefault && (
                      <RButton
                        label="Reset to default"
                        variant="secondary"
                        size="m"
                        icon="refresh"
                        iconPosition="leading"
                        onPress={() => handleResetPlan(selectedPlan)}
                      />
                    )}
                  </>
                )}

                {(planMode === 'edit' || planMode === 'add') && (
                  <>
                    <RFormField label="Plan name" value={draftPlanTitle} onChangeText={setDraftPlanTitle} placeholder="e.g. Fire plan" />
                    <RFormField
                      label="Steps (one per line)"
                      value={draftPlanSteps}
                      onChangeText={setDraftPlanSteps}
                      placeholder={'Close all windows\nTurn off gas\nLeave via safe route'}
                      multiline
                    />

                    <View style={{ gap: spacing.scale[2] }}>
                      <RText variant="caption" color={colors.ink3}>
                        Safe location
                      </RText>
                      <LocationSelector
                        locations={safeLocations}
                        defaultLocation={defaultLocation}
                        value={draftPlanLocationId}
                        onChange={setDraftPlanLocationId}
                        theme={theme}
                      />
                    </View>

                    <RButton
                      label={planMode === 'add' ? 'Add plan' : 'Save changes'}
                      variant="primary"
                      size="l"
                      icon="checkmark"
                      iconPosition="leading"
                      onPress={handleSavePlan}
                    />
                  </>
                )}
              </View>
            </ScrollView>
          </RCenteredOverlay>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyState: {
    padding: 18,
  },
  locationRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 52,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
    gap: 2,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 52,
  },
  planIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  pickerScroll: {
    maxHeight: 420,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  pickerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  addressFieldWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
