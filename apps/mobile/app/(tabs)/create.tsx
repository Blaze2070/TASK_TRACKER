import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['DateTimePicker: \'onChange\' is deprecated']);
import { tasksApi } from '../../src/services/api';
import { colors, spacing, fontSize } from '../../src/utils/theme';
import { formatDateUTC } from '../../src/utils/date';

const priorities = [
  { key: 'LOW', label: 'Низкий', color: colors.darkGreenLight },
  { key: 'MEDIUM', label: 'Средний', color: colors.orange },
  { key: 'HIGH', label: 'Высокий', color: colors.red },
  { key: 'CRITICAL', label: 'Критический', color: '#B71C1C' },
];

export default function CreateTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [progress, setProgress] = useState('0');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getStatusConfig = (val: number) => {
    if (val === 100) return { label: 'Выполнена', icon: '✅', color: colors.statusCompleted };
    if (val > 0) return { label: 'В работе', icon: '🔄', color: colors.statusInProgress };
    return { label: 'Ожидает', icon: '⏳', color: colors.statusPending };
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название задачи');
      return;
    }

    const progressNum = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
    const autoStatus = progressNum === 100 ? 'COMPLETED' : progressNum > 0 ? 'IN_PROGRESS' : 'PENDING';

    setLoading(true);
    try {
      await tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
        progress: progressNum,
        status: autoStatus,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      });
      Alert.alert('Успешно', 'Задача создана', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось создать задачу');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image source={require('../../assets/cbo_logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Новая задача</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Название задачи *</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите название задачи"
          placeholderTextColor={colors.gray}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Введите описание задачи"
          placeholderTextColor={colors.gray}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Приоритет</Text>
        <View style={styles.priorityContainer}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.priorityButton,
                priority === p.key && { backgroundColor: p.color, borderColor: p.color },
              ]}
              onPress={() => setPriority(p.key)}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === p.key && { color: colors.white },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Прогресс (автостатус)</Text>
        <View style={styles.progressWrapper}>
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
        <View style={styles.statusPreview}>
          <Text style={styles.statusPreviewIcon}>{getStatusConfig(Number(progress)).icon}</Text>
          <Text style={[styles.statusPreviewText, { color: getStatusConfig(Number(progress)).color }]}>
            {getStatusConfig(Number(progress)).label}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Срок выполнения</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
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
            onChange={(_event: any, selectedDate?: Date) => {
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Создание...' : 'Создать задачу'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.darkGreen,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.lightGray,
  },
  priorityText: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.black,
  },
  clearDate: {
    color: colors.gray,
    fontSize: fontSize.lg,
    padding: spacing.xs,
  },
  progressWrapper: {
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
  statusPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  statusPreviewIcon: {
    fontSize: 16,
  },
  statusPreviewText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.darkGreen,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});