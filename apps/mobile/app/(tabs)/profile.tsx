import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { exportApi } from '../../src/services/api';
import * as FileSystem from 'expo-file-system/legacy';
const cacheDir: string = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
import * as Sharing from 'expo-sharing';
import { sendTestNotification } from '../../src/services/notifications';
import { colors, spacing, fontSize } from '../../src/utils/theme';

const CBO_LOGO = require('../../assets/cbo_logo.png') as any;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [exporting, setExporting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => {
        logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await exportApi.csv();
      const csvData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const fileUri = cacheDir + 'tasks_export.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Экспорт задач',
        });
      } else {
        Alert.alert('Успешно', 'Файл сохранён');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось экспортировать задачи. Убедитесь, что сервер запущен.');
    } finally {
      setExporting(false);
    }
  };

  const [testingNotification, setTestingNotification] = useState(false);

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      await sendTestNotification();
      Alert.alert('Успешно', 'Тестовое уведомление отправлено');
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось отправить тестовое уведомление');
    } finally {
      setTestingNotification(false);
    }
  };

  const menuItems = [
    {
      icon: '📄',
      title: 'Экспорт задач',
      subtitle: 'Скачать список задач в формате CSV',
      action: handleExportCSV,
    },
    {
      icon: '🔔',
      title: 'Тест уведомлений',
      subtitle: 'Проверить, что push-уведомления работают',
      action: handleTestNotification,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={CBO_LOGO} style={styles.avatarLogo} resizeMode="contain" />
          <View style={styles.statusDot} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, user?.role === 'ADMIN' ? styles.adminBadge : styles.userBadge]}>
          <Text style={styles.roleText}>
            {user?.role === 'ADMIN' ? '🔑 Администратор' : '👤 Пользователь'}
          </Text>
        </View>
      </View>

        <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Действия</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, testingNotification && styles.menuItemDisabled]}
            onPress={item.action}
            disabled={testingNotification}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              {exporting ? (
                <ActivityIndicator size="small" color={colors.darkGreen} />
              ) : (
                <Text style={styles.menuIcon}>{item.icon}</Text>
              )}
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <View style={styles.logoutContent}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Трекер задач МКУ ЦБО v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  profileCard: {
    backgroundColor: colors.darkGreen,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarLogo: {
    width: 70,
    height: 70,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    color: colors.white,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: colors.darkGreen,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  adminBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  roleText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    margin: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors.darkGray,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: fontSize.lg,
    color: colors.gray,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    gap: spacing.sm,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    color: colors.red,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 60,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.gray,
  },
});