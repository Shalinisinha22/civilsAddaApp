import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  EventType,
  AndroidStyle,
} from '@notifee/react-native';
import { api } from '@api/api';
import { colors } from '@theme/colors';

const TEST_CHANNEL_ID = 'tests';

let testChannelId: string | null = null;
let navigateToTest: ((testId: string) => void) | null = null;
let pendingTestId: string | null = null;

export const setTestNavigator = (fn: ((testId: string) => void) | null) => {
  navigateToTest = fn;
};

export const getPendingTestId = () => pendingTestId;

export const clearPendingTestId = () => {
  pendingTestId = null;
};

const ensureChannel = async () => {
  if (testChannelId) {
    return testChannelId;
  }
  testChannelId = await notifee.createChannel({
    id: TEST_CHANNEL_ID,
    name: 'New Test Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
  return testChannelId;
};

const getMessageData = (message: any): Record<string, string> => {
  const data = message?.data || {};
  return {
    testId: data?.testId || '',
    testTitle: data?.testTitle || '',
    type: data?.type || '',
  };
};

const displayNotification = async (message: any) => {
  const channelId = await ensureChannel();
  const data = getMessageData(message);

  await notifee.displayNotification({
    title: message?.notification?.title || data.testTitle || 'Civils Adda',
    body: message?.notification?.body || 'A new test is available. Tap to open it.',
    data,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default', launchActivity: 'default' },
      color: colors.primary,
      style: data.testTitle ? { type: AndroidStyle.BIGTEXT, text: data.testTitle } : undefined,
      actions: [],
    },
  });
};

const openTestFromData = (data: Record<string, string>) => {
  if (data?.testId) {
    navigateToTest?.(data.testId);
  }
};
export const initNotifications = () => {
  // Create the high-importance channel up front so it exists even
  // when the app is backgrounded/killed and the system shows the tray notification.
  ensureChannel();

  // Foreground messages: show as a heads-up notification via notifee.
  messaging().onMessage(async (remoteMessage) => {
    try {
      await displayNotification(remoteMessage);
    } catch (error) {
      console.error('[notifications] onMessage error:', error);
    }
  });

  // App in background: tapping the system notification brings the app up.
  messaging().onNotificationOpenedApp((remoteMessage) => {
    openTestFromData(getMessageData(remoteMessage));
  });

  // App killed: cold start from a notification.
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        const data = getMessageData(remoteMessage);
        if (data.testId) {
          pendingTestId = data.testId;
        }
      }
    })
    .catch(() => {});

  // Taps on foreground (notifee) notifications.
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const data = detail.notification?.data || {};
      openTestFromData(data as Record<string, string>);
    }
  });
};

const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch {
    return false;
  }
};

export const registerDeviceToken = async () => {
  try {
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      return;
    }

    const token = await messaging().getToken();
    if (!token) {
      return;
    }

    await api.notifications.registerDeviceToken(token, 'android');
  } catch (error) {
    console.error('[notifications] registerDeviceToken error:', error);
  }
};

export const unregisterDeviceToken = async () => {
  try {
    const token = await messaging().getToken();
    if (token) {
      await api.notifications.removeDeviceToken(token);
    }
  } catch (error) {
    console.error('[notifications] unregisterDeviceToken error:', error);
  }
};
