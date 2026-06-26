import { Stack } from 'expo-router';
import { colors } from '../../src/utils/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkGreen },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Вход' }} />
      <Stack.Screen name="register" options={{ title: 'Регистрация' }} />
    </Stack>
  );
}