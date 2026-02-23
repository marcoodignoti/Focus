import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap — frequent tiny interactions (icon pick, ruler tick, toggle) */
export const selection = () => {
  if (isNative) Haptics.selectionAsync().catch(() => {});
};

/** Medium impact — deliberate taps (start focus, mode select) */
export const impactMedium = () => {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

/** Light impact — long-press entry, edit toggle */
export const impactLight = () => {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Heavy impact — hold-to-stop completed */
export const impactHeavy = () => {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};

/** Success — timer complete, mode created */
export const notifySuccess = () => {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

/** Warning — hold-to-stop completed, delete */
export const notifyWarning = () => {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

/** Error — blocked action */
export const notifyError = () => {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
