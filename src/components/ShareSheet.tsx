import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FAMILY } from '../data/family';
import { MapAlert } from '../data/alerts';
import { severityLevels } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { RBottomSheet } from './RBottomSheet';
import { RText } from './RText';

interface ShareSheetProps {
  alert: MapAlert | null;
  onClose: () => void;
}

interface ShareChannel {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Visual only, per spec - none of these actually send anything yet.
const SHARE_CHANNELS: ShareChannel[] = [
  { key: 'copy', label: 'Copy link', icon: 'link-outline' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { key: 'sms', label: 'Messages', icon: 'chatbox-ellipses-outline' },
  { key: 'email', label: 'Email', icon: 'mail-outline' },
  { key: 'save', label: 'Save image', icon: 'download-outline' },
  { key: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline' },
];

export function ShareSheet({ alert, onClose }: ShareSheetProps) {
  const { colors, severity } = useTheme();

  return (
    <RBottomSheet visible={!!alert} onClose={onClose} accessibilityLabel="Close share sheet">
      {alert &&
        (() => {
          const tone = severity[alert.tone];
          const level = severityLevels[alert.tone];

          return (
            <Fragment>
              <View style={styles.headerRow}>
                  <RText variant="bodyEmphasis" color={colors.ink}>
                    Share warning
                  </RText>
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={[styles.closeButton, { backgroundColor: colors.surface2 }]}
                  >
                    <Ionicons name="close" size={18} color={colors.ink} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  {/* Poster preview - what the recipient would see, like a link preview card */}
                  <View style={[styles.poster, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                    <View style={[styles.posterHeader, { backgroundColor: tone.bg }]}>
                      <View style={[styles.posterIconCircle, { backgroundColor: tone.fg }]}>
                        <Ionicons name={alert.icon} size={22} color="white" />
                      </View>
                      <RText variant="eyebrowLabel" color={tone.fg}>
                        {level.label}
                      </RText>
                    </View>

                    <View style={styles.posterBody}>
                      <RText variant="bodyEmphasis" color={colors.ink}>
                        {alert.title}
                      </RText>
                      <View style={styles.posterMetaRow}>
                        <Ionicons name="location-outline" size={13} color={colors.ink3} />
                        <RText variant="caption" color={colors.ink3}>
                          {alert.distanceKm} km away · Updated {alert.updatedMinAgo} min ago
                        </RText>
                      </View>
                      <View style={[styles.posterAction, { backgroundColor: colors.surface2 }]}>
                        <Ionicons name="alert-circle" size={16} color={colors.ink2} />
                        <RText variant="secondary" color={colors.ink2} style={styles.posterActionText}>
                          {alert.instructions[0]}
                        </RText>
                      </View>
                    </View>

                    <View style={[styles.posterFooter, { borderTopColor: colors.hairline }]}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.ink3} />
                      <RText variant="micro" color={colors.ink3}>
                        Shared from InclusiveEWS
                      </RText>
                    </View>
                  </View>

                  <RText variant="eyebrowLabel" color={colors.ink3} style={styles.sectionLabel}>
                    SEND TO
                  </RText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsRow}>
                    {FAMILY.map((member) => (
                      <Pressable
                        key={member.id}
                        style={styles.contactItem}
                        accessibilityRole="button"
                        accessibilityLabel={`Share to ${member.name}`}
                      >
                        <View style={[styles.contactAvatar, { backgroundColor: colors.surface2 }]}>
                          <RText variant="bodyEmphasis" color={colors.ink2}>
                            {member.name.charAt(0)}
                          </RText>
                        </View>
                        <RText variant="caption" color={colors.ink2} numberOfLines={1} style={styles.contactName}>
                          {member.name}
                        </RText>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <RText variant="eyebrowLabel" color={colors.ink3} style={styles.sectionLabel}>
                    SHARE VIA
                  </RText>
                  <View style={styles.channelsRow}>
                    {SHARE_CHANNELS.map((channel) => (
                      <Pressable
                        key={channel.key}
                        style={styles.channelItem}
                        accessibilityRole="button"
                        accessibilityLabel={channel.label}
                      >
                        <View style={[styles.channelIcon, { backgroundColor: colors.surface2 }]}>
                          <Ionicons name={channel.icon} size={22} color={colors.ink} />
                        </View>
                        <RText variant="caption" color={colors.ink2} numberOfLines={1}>
                          {channel.label}
                        </RText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </Fragment>
            );
          })()}
    </RBottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  poster: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  posterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  posterIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterBody: {
    padding: 16,
    gap: 8,
  },
  posterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  posterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  posterActionText: {
    flex: 1,
  },
  posterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  sectionLabel: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  contactsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
  },
  contactItem: {
    alignItems: 'center',
    gap: 6,
    width: 60,
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    textAlign: 'center',
  },
  channelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  channelItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
