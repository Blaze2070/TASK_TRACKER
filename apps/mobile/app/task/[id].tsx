import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { tasksApi } from '../../src/services/api';
import { Task, TaskHistory } from '../../src/types';
import { colors, spacing, fontSize } from '../../src/utils/theme';
import { formatDateUTC, formatDateTimeUTC } from '../../src/utils/date';

const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
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

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressValue, setProgressValue] = useState('0');

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      const [taskRes, historyRes] = await Promise.all([
        tasksApi.getById(id),
        tasksApi.getHistory(id),
      ]);
      setTask(taskRes.data);
      setHistory(historyRes.data);
      setProgressValue(String(taskRes.data.progress));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить задачу');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await tasksApi.update(id, { status: newStatus as any });
      setTask(updated.data);
      const historyRes = await tasksApi.getHistory(id);
      setHistory(historyRes.data);
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  const autoStatus = (val: number) => {
    if (val === 100) return 'COMPLETED';
    if (val > 0) return 'IN_PROGRESS';
    return 'PENDING';
  };

  const handleProgressUpdate = async () => {
    const progress = Math.min(100, Math.max(0, parseInt(progressValue, 10) || 0));
    const nextStatus = autoStatus(progress);
    try {
      const updated = await tasksApi.update(id, { progress, status: nextStatus });
      setTask(updated.data);
      const historyRes = await tasksApi.getHistory(id);
      setHistory(historyRes.data);
      setShowProgressInput(false);
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось обновить прогресс');
    }
  };

  const handleDelete = () => {
    Alert.alert('Удаление задачи', 'Вы уверены, что хотите удалить задачу?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await tasksApi.delete(id);
            router.back();
          } catch (error: any) {
            Alert.alert('Ошибка', 'Не удалось удалить задачу');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.darkGreen} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Задача не найдена</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusConfig[task.status] || statusConfig.PENDING;
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const dueDate = task.dueDate ? formatDateUTC(task.dueDate, { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const formatDate = (dateStr: string) => {
    return formatDateTimeUTC(dateStr);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Детали задачи',
          headerStyle: { backgroundColor: colors.darkGreen },
          headerTintColor: colors.white,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => router.push(`/edit/${id}`)} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerDeleteButton}>
                <Text style={styles.headerDeleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: priority.color }]}>
              <Text style={styles.badgeText}>{priority.icon} {priority.label}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: status.color }]}>
              <Text style={styles.badgeText}>{status.icon} {status.label}</Text>
            </View>
          </View>
          <Text style={styles.title}>{task.title}</Text>
          {task.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionIcon}>📝</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Прогресс</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressPercent}>{task.progress}%</Text>
              <TouchableOpacity onPress={() => { setProgressValue(String(task.progress)); setShowProgressInput(!showProgressInput); }}>
                <Text style={styles.editLink}>{showProgressInput ? '✕ Отмена' : '✏️ Изменить'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${task.progress}%`, backgroundColor: task.progress === 100 ? colors.statusCompleted : colors.darkGreen }]} />
            </View>
            {showProgressInput && (
              <View style={styles.progressInputRow}>
                <TextInput
                  style={styles.progressInput}
                  value={progressValue}
                  onChangeText={setProgressValue}
                  keyboardType="numeric"
                  placeholder="0-100"
                  placeholderTextColor={colors.gray}
                />
                <TouchableOpacity style={styles.progressSaveButton} onPress={handleProgressUpdate}>
                  <Text style={styles.progressSaveText}>💾 Сохранить</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Статус</Text>
          <View style={styles.statusGrid}>
            {Object.entries(statusConfig).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.statusButton,
                  task.status === key && { backgroundColor: config.color, borderColor: config.color },
                ]}
                onPress={() => handleStatusChange(key)}
              >
                <Text style={styles.statusButtonIcon}>{config.icon}</Text>
                <Text style={[
                  styles.statusButtonText,
                  task.status === key && { color: colors.white },
                ]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Информация</Text>
          <View style={styles.infoCard}>
            {dueDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>⏰</Text>
                <Text style={styles.infoLabel}>Срок выполнения</Text>
                <Text style={[styles.infoValue, isOverdue && styles.overdue]}>{dueDate} {isOverdue ? '⛔' : ''}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Создана</Text>
              <Text style={styles.infoValue}>{formatDate(task.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔄</Text>
              <Text style={styles.infoLabel}>Обновлена</Text>
              <Text style={styles.infoValue}>{formatDate(task.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 История изменений</Text>
            <View style={styles.historyContainer}>
              {history.map((item, index) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  {index < history.length - 1 && <View style={styles.historyLine} />}
                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyField}>📌 {item.field}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={styles.historyChangeRow}>
                      <View style={styles.historyValueBox}>
                        <Text style={styles.historyValueLabel}>Было</Text>
                        <Text style={styles.historyValue}>{item.oldValue || '(пусто)'}</Text>
                      </View>
                      <Text style={styles.historyArrow}>→</Text>
                      <View style={styles.historyValueBox}>
                        <Text style={styles.historyValueLabel}>Стало</Text>
                        <Text style={styles.historyValue}>{item.newValue || '(пусто)'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
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
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.darkGray,
  },
  backButton: {
    backgroundColor: colors.darkGreen,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  headerDeleteButton: {
    padding: spacing.sm,
  },
  headerDeleteText: {
    fontSize: 20,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  descriptionCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  descriptionIcon: {
    fontSize: 16,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    lineHeight: 20,
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing.md,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressPercent: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.darkGreen,
  },
  editLink: {
    fontSize: fontSize.sm,
    color: colors.darkGreen,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E8E8E8',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.black,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  progressSaveButton: {
    backgroundColor: colors.darkGreen,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  progressSaveText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: colors.white,
  },
  statusButtonIcon: {
    fontSize: 14,
  },
  statusButtonText: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'right',
  },
  overdue: {
    color: colors.red,
  },
  historyContainer: {
    paddingLeft: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: spacing.md,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.darkGreen,
    marginTop: 4,
    marginRight: spacing.md,
    zIndex: 1,
  },
  historyLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -16,
    width: 2,
    backgroundColor: colors.darkGreen + '40',
  },
  historyContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  historyField: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.darkGreen,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.gray,
  },
  historyChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyValueBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: spacing.sm,
  },
  historyValueLabel: {
    fontSize: fontSize.xs,
    color: colors.gray,
    marginBottom: 2,
  },
  historyValue: {
    fontSize: fontSize.sm,
    color: colors.black,
    fontWeight: '500',
  },
  historyArrow: {
    fontSize: 16,
    color: colors.darkGreen,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerButtonText: {
    fontSize: 20,
  },
});
