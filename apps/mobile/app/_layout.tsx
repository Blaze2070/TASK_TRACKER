import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, Image } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { colors, spacing, fontSize } from '../src/utils/theme';
import { registerForPushNotifications, setupNotificationListener, requestNotificationPermission } from '../src/services/notifications';
import { useRouter } from 'expo-router';

const CBO_LOGO = require('../assets/cbo_logo.png') as any;

function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
      <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
        <Image source={CBO_LOGO} style={{ width: 100, height: 100, marginBottom: spacing.lg }} resizeMode="contain" />
        <Text style={{ fontSize: fontSize.title, fontWeight: '800', color: colors.darkGreen }}>Трекер задач</Text>
        <Text style={{ fontSize: fontSize.lg, color: colors.darkGreenLight, marginTop: spacing.xs }}>МКУ ЦБО</Text>
      </View>
      <ActivityIndicator size="large" color={colors.darkGreen} />
    </View>
  );
}

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadStoredAuth } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadStoredAuth();
      setAppIsReady(true);
    })();
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
          await registerForPushNotifications();
        } else {
          console.log('Пользователь отклонил разрешение на уведомления');
        }
      })();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = setupNotificationListener(router);
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  if (isLoading || !appIsReady) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ headerShown: true, title: 'Детали задачи' }} />
        <Stack.Screen name="edit/[id]" options={{ headerShown: true, title: 'Редактирование задачи' }} />
      </Stack>
    </>
  );
}