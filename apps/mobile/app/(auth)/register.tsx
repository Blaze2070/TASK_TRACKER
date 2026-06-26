import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, fontSize } from '../../src/utils/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Ошибка регистрации', error.response?.data?.error || 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image source={require('../../assets/cbo_logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Создать аккаунт</Text>
          <Text style={styles.subtitle}>Присоединяйтесь к Трекеру задач МКУ ЦБО</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите ваше имя"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите email"
            placeholderTextColor={colors.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите пароль (мин. 6 символов)"
            placeholderTextColor={colors.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>
              Уже есть аккаунт? <Text style={styles.linkHighlight}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.darkGreen,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
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
  button: {
    backgroundColor: colors.darkGreen,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.darkGray,
  },
  linkHighlight: {
    color: colors.darkGreen,
    fontWeight: '600',
  },
});