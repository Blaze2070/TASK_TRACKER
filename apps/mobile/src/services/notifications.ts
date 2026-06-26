import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { pushApi } from './api';
import { Task } from '../types';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const skipNotifications = isExpoGo && Platform.OS === 'android';

interface NotificationsModuleType {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: () => Promise<{ data: string }>;
  scheduleNotificationAsync: (request: any) => Promise<string>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  addNotificationResponseReceivedListener: (handler: (response: any) => void) => { remove: () => void };
  setNotificationHandler: (handler: any) => void;
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: string;
    DATE: string;
  };
}

let NotificationsModule: NotificationsModuleType | null = null;
let loadAttempted = false;

async function loadNotificationsModule(): Promise<NotificationsModuleType | null> {
  if (loadAttempted) return NotificationsModule;
  loadAttempted = true;

  if (skipNotifications) {
    return null;
  }

  try {
    const mod = await import('expo-notifications');
    const m = mod as unknown as NotificationsModuleType;

    try {
      m.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {
      // ignore
    }

    NotificationsModule = m;
    return m;
  } catch (error) {
    console.warn('expo-notifications недоступен:', error);
    return null;
  }
}

export async function registerForPushNotifications(): Promise<void> {
  const mod = await loadNotificationsModule();
  if (!mod) return;

  try {
    let { status: existingStatus } = await mod.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await mod.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Не удалось получить разрешение на уведомления');
      return;
    }

    console.log('Разрешение на уведомления получено:', finalStatus);

    try {
      const tokenData = await mod.getExpoPushTokenAsync();
      const token = tokenData.data;
      await pushApi.registerToken(token);
      console.log('Push-токен зарегистрирован на сервере');
    } catch {
      console.log('Push-токен не поддерживается в этой среде');
    }
  } catch (error) {
    console.error('Ошибка регистрации push-уведомлений:', error);
  }
}

export function setupNotificationListener(router?: { push: (path: string) => void }): () => void {
  if (skipNotifications) return () => {};

  let subscription: { remove: () => void } | null = null;

  (async () => {
    const mod = await loadNotificationsModule();
    if (!mod) return;

    subscription = mod.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      if (data?.taskId && router) {
        router.push(`/task/${data.taskId}`);
      }
    });
  })();

  return () => {
    if (subscription) subscription.remove();
  };
}

export async function sendTestNotification(): Promise<void> {

  const mod = await loadNotificationsModule();
  if (!mod) {
    Alert.alert('🔔 Уведомления', 'Модуль уведомлений недоступен');
    return;
  }

  await mod.scheduleNotificationAsync({
    content: {
      title: 'Тестовое уведомление',
      body: 'Уведомления работают корректно ✅',
      data: { source: 'test' },
    },
    trigger: null,
  });
}

export async function scheduleDeadlineNotifications(tasks: Task[]): Promise<void> {
  if (skipNotifications) return;

  const mod = await loadNotificationsModule();
  if (!mod) return;

  const now = Date.now();

  try {
    const { status } = await mod.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await mod.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }
  } catch {
    return;
  }

  await mod.cancelAllScheduledNotificationsAsync();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') continue;

    const dueTime = new Date(task.dueDate).getTime();
    if (isNaN(dueTime)) continue;

    const isOverdue = dueTime <= now;

    if (isOverdue) {
      await mod.scheduleNotificationAsync({
        content: {
          title: '⛔ Просроченная задача',
          body: `«${task.title}» — дедлайн прошёл`,
          data: { taskId: task.id, source: 'deadline', status: 'overdue' },
        },
        trigger: { type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
      }).catch(e => console.error(e));
    } else {
      const trigger24h = dueTime - 24 * 60 * 60 * 1000;
      if (trigger24h > now) {
        await mod.scheduleNotificationAsync({
          content: {
            title: '⏰ Приближается дедлайн',
            body: `«${task.title}» — дедлайн в течение 24 часов`,
            data: { taskId: task.id, source: 'deadline', status: 'approaching' },
          },
          trigger: { type: mod.SchedulableTriggerInputTypes.DATE, date: new Date(trigger24h) },
        }).catch(e => console.error(e));
      }

      const trigger12h = dueTime - 12 * 60 * 60 * 1000;
      if (trigger12h > now) {
        await mod.scheduleNotificationAsync({
          content: {
            title: '🔥 Срок истекает скоро!',
            body: `«${task.title}» — дедлайн менее чем через 12 часов`,
            data: { taskId: task.id, source: 'deadline', status: 'critical' },
          },
          trigger: { type: mod.SchedulableTriggerInputTypes.DATE, date: new Date(trigger12h) },
        }).catch(e => console.error(e));
      }
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (skipNotifications) return false;

  const mod = await loadNotificationsModule();
  if (!mod) return false;

  try {
    const { status: existingStatus } = await mod.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await mod.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Ошибка запроса разрешения:', error);
    return false;
  }
}