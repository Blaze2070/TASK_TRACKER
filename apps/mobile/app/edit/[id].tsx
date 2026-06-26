import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { tasksApi } from '../../src/services/api';
import { Task } from '../../src/types';
import { colors, spacing, fontSize } from '../../src/utils/theme';
import { formatDateUTC } from '../../src/utils/date';

const priorities = [
  { key: 'LOW', label: 'Низкий', color: colors.darkGreenLight },
  { key: 'MEDIUM', label: 'Средний', color: colors.orange },
  { key: 'HIGH', label: 'Высокий', color: colors.red },
  { key: 'CRITICAL', label: 'Критический', color: '#B71C1C' },
];

const statuses = [
  { key: 'PENDING', label: 'Ожидает', icon: '⏳' },
  { key: 'IN_PROGRESS', label: 'В работе', icon: '🔄' },
  { key: 'COMPLETED', label: 'Выполнена', icon: '✅' },
  { key: 'CANCELLED', label: 'Отменена', icon: '❌' },
];

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState('0');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      const response = await tasksApi.getById(id);
      const loadedTask: Task = response.data;
      setTask(loadedTask);
      setTitle(loadedTask.title);
      setDescription(loadedTask.description || '');
      setPriority(loadedTask.priority);
      setStatus(loadedTask.status);
      setProgress(String(loadedTask.progress));
      setDueDate(loadedTask.dueDate ? new Date(loadedTask.dueDate) : null);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить задачу');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const autoStatus = (val: number) => {
    if (val === 100) return 'COMPLETED';
    if (val > 0) return 'IN_PROGRESS';
    return 'PENDING';
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Название задачи не может быть пустым');
      return;
    }

    const progressNum = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
    const nextStatus = progressNum === 100 ? 'COMPLETED' : progressNum > 0 ? 'IN_PROGRESS' : 'PENDING';
    const changedFields: string[] = [];

    if (task) {
      if (task.title !== title.trim()) changedFields.push('title');
      if (task.description !== description.trim()) changedFields.push('description');
      if (task.priority !== priority) changedFields.push('priority');
      if (task.status !== nextStatus) changedFields.push('status');
      if (task.progress !== progressNum) changedFields.push('progress');
      if (dueDate ? dueDate.toISOString() !== task.dueDate : !!task.dueDate) changedFields.push('dueDate');
    }

    setSaving(true);
    try {
      await tasksApi.update(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
        status: nextStatus,
        progress: progressNum,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        changedFields,
      } as any);
      Alert.alert('Успешно', 'Задача обновлена', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Название задачи *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Введите название"
          placeholderTextColor={colors.gray}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Введите описание"
          placeholderTextColor={colors.gray}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Статус</Text>
        <View style={styles.statusGrid}>
          {statuses.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.statusButton,
                status === s.key && { backgroundColor: colors.darkGreen, borderColor: colors.darkGreen },
              ]}
              onPress={() => setStatus(s.key)}
            >
              <Text style={styles.statusIcon}>{s.icon}</Text>
              <Text style={[styles.statusText, status === s.key && { color: colors.white }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Приоритет</Text>
        <View style={styles.priorityGrid}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.priorityButton,
                priority === p.key && { backgroundColor: p.color, borderColor: p.color },
              ]}
              onPress={() => setPriority(p.key)}
            >
              <Text style={[styles.priorityText, priority === p.key && { color: colors.white }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Прогресс: {progress}%</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Number(progress) || 0}%`, backgroundColor: Number(progress) === 100 ? colors.statusCompleted : colors.darkGreen }]} />
            </View>
          </View>
          <TextInput
            style={styles.progressInput}
            value={progress}
            onChangeText={setProgress}
            keyboardType="numeric"
            placeholder="0-100"
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Срок выполнения</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, !dueDate && { color: colors.gray }]}>
            {dueDate
              ? formatDateUTC(dueDate.toISOString(), { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Выберите дату'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)}>
              <Text style={styles.clearDate}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Сохранение...' : '💾 Сохранить изменения'}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  loadingText: {
    fontSize: fontSize.md,
    color: colors.darkGray,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.black,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: colors.white,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    fontWeight: '600',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressInput: {
    width: 70,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.black,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.black,
    flex: 1,
  },
  clearDate: {
    color: colors.gray,
    fontSize: fontSize.lg,
    padding: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.darkGreen,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});