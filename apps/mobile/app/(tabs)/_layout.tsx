import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, fontSize } from '../../src/utils/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.darkGreen },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: colors.darkGreen,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.lightGray,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Задачи',
          headerTitle: 'Трекер задач МКУ ЦБО',
          tabBarLabel: 'Задачи',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Новая задача',
          headerTitle: 'Создание задачи',
          tabBarLabel: 'Создать',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          headerTitle: 'Профиль',
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}