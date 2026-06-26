import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Dimensions, TextInput, Alert, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { tasksApi } from '../../src/services/api';
import { Task } from '../../src/types';
import { scheduleDeadlineNotifications } from '../../src/services/notifications';
import { colors, spacing, fontSize } from '../../src/utils/theme';
import { formatDateUTC } from '../../src/utils/date';

const { width } = Dimensions.get('window');
const CBO_LOGO = require('../../assets/cbo_logo.png') as any;

const statusLabels: Record<string, { label: string; icon: string; color: string }> = {
  PENDING: { label: 'Ожидает', icon: '⏳', color: colors.statusPending },
  IN_PROGRESS: { label: 'В работе', icon: '🔄', color: colors.statusInProgress },
  COMPLETED: { label: 'Выполнена', icon: '✅', color: colors.statusCompleted },
  CANCELLED: { label: 'Отменена', icon: '❌', color: colors.statusCancelled },
};

const priorityConfig: Record<string, { label: string; icon: string; color: string }> = {
  LOW: { label: 'Низкий', icon: '⬇️', color: colors.darkGreenLight },
  MEDIUM: { label: 'Средний', icon: '➡️', color: colors.orange },
  HIGH: { label: 'Высокий', icon: '⬆️', color: colors.red },
  CRITICAL: { label: 'Критический', icon: '🔥', color: '#B71C1C' },
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [editingProgress, setEditingProgress] = useState<{ taskId: string; value: string } | null>(null);
  const router = useRouter();

  const fetchTasks = async () => {
    try {
      const params: { status?: string } = {};
      if (filter !== 'all') params.status = filter;
      const response = await tasksApi.getAll(params);
      const loadedTasks = response.data;
      setTasks(loadedTasks);
      scheduleDeadlineNotifications(loadedTasks);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getStatusColor = (status: string) => statusLabels[status]?.color || colors.gray;

  const updateProgress = async (taskId: string, newProgress: number) => {
    try {
      await tasksApi.update(taskId, { progress: newProgress });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, progress: newProgress } : t));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить прогресс');
    } finally {
      setEditingProgress(null);
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const dueDate = item.dueDate ? formatDateUTC(item.dueDate) : null;
    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'COMPLETED';
    const priority = priorityConfig[item.priority] || priorityConfig.MEDIUM;
    const status = statusLabels[item.status] || statusLabels.PENDING;
    const isEditing = editingProgress?.taskId === item.id;

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => router.push({ pathname: '/task/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.taskTopRow}>
          <View style={[styles.priorityBadge, { backgroundColor: priority.color }]}>
            <Text style={styles.badgeIcon}>{priority.icon}</Text>
            <Text style={styles.priorityText}>{priority.label}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.badgeIcon}>{status.icon}</Text>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>

        {item.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.progressRow}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.progress === 100 ? colors.statusCompleted : colors.darkGreen }]} />
            </View>
          </View>
          {isEditing ? (
            <View style={styles.inlineEditContainer}>
              <TextInput
                style={styles.inlineInput}
                value={editingProgress.value}
                onChangeText={(text) => setEditingProgress({ ...editingProgress, value: text })}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <TouchableOpacity onPress={() => {
                const val = parseInt(editingProgress.value, 10);
                if (isNaN(val) || val < 0 || val > 100) {
                  Alert.alert('Ошибка', 'Введите число от 0 до 100');
                  return;
                }
                updateProgress(item.id, val);
              }}>
                <Text style={styles.inlineSave}>💾</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingProgress({ taskId: item.id, value: String(item.progress) })}>
              <Text style={styles.progressLabel}>{item.progress}%</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.taskFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerIcon}>📅</Text>
            <Text style={styles.footerText}>
              {formatDateUTC(item.createdAt)}
            </Text>
          </View>
          {dueDate && (
            <View style={styles.footerItem}>
              <Text style={styles.footerIcon}>{isOverdue ? '⛔' : '⏰'}</Text>
              <Text style={[styles.footerText, isOverdue && styles.overdueText]}>
                {dueDate}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filters = [
    { key: 'all', label: '📋 Все', icon: '📋' },
    { key: 'PENDING', label: '⏳ Ожидают', icon: '⏳' },
    { key: 'IN_PROGRESS', label: '🔄 В работе', icon: '🔄' },
    { key: 'COMPLETED', label: '✅ Выполнены', icon: '✅' },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.darkGreen} />
          <Text style={styles.loadingText}>Загрузка задач...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={CBO_LOGO} style={styles.headerLogo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Трекер задач</Text>
        <Text style={styles.headerSubtitle}>МКУ ЦБО</Text>
      </View>
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tasks.length === 0 ? styles.emptyListContainer : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.darkGreen]} tintColor={colors.darkGreen} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
            </View>
            <Text style={styles.emptyTitle}>Нет задач</Text>
            <Text style={styles.emptyDescription}>
              {filter === 'all'
                ? 'Создайте первую задачу, нажав на кнопку "Создать" внизу экрана'
                : 'Нет задач с выбранным статусом'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/create')}>
              <Text style={styles.emptyButtonText}>➕ Создать задачу</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.darkGray,
  },
  header: {
    backgroundColor: colors.darkGreen,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.white,
    opacity: 0.8,
  },
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    minWidth: 70,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.darkGreen,
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: fontSize.xs,
    color: colors.darkGray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + 60,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  priorityText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  taskDescription: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.darkGreen,
    minWidth: 40,
    textAlign: 'right',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerIcon: {
    fontSize: 12,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.darkGray,
  },
  overdueText: {
    color: colors.red,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.darkGreen,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  inlineEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.darkGreen,
  },
  inlineSave: {
    fontSize: 20,
  },
});
