import bcrypt from 'bcryptjs';
import { authService } from '../src/services/auth.service';
import { mockSelect, mockInsert, createQueryChain } from './setup';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      mockSelect.mockReturnValue(createQueryChain([]));

      const newUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsert.mockReturnValue(createQueryChain([newUser]));

      const result = await authService.register('test@example.com', 'password123', 'Test User');

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.token).toBeDefined();
      expect(mockSelect).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw error when email already exists', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Existing',
        role: 'USER' as const,
      };

      mockSelect.mockReturnValue(createQueryChain([existingUser]));

      await expect(
        authService.register('test@example.com', 'password123', 'Test')
      ).rejects.toThrow('Пользователь с таким email уже существует');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER' as const,
      };

      mockSelect.mockReturnValue(createQueryChain([existingUser]));

      const result = await authService.login('test@example.com', plainPassword);

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error when user not found', async () => {
      mockSelect.mockReturnValue(createQueryChain([]));

      await expect(
        authService.login('unknown@example.com', 'password123')
      ).rejects.toThrow('Неверный email или пароль');
    });

    it('should throw error when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);

      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER' as const,
      };

      mockSelect.mockReturnValue(createQueryChain([existingUser]));

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Неверный email или пароль');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profileData = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        createdAt: new Date(),
      };

      mockSelect.mockReturnValue(createQueryChain([profileData]));

      const profile = await authService.getProfile('user-1');

      expect(profile.email).toBe('test@example.com');
      expect(profile.name).toBe('Test User');
    });

    it('should throw error when user not found', async () => {
      mockSelect.mockReturnValue(createQueryChain([]));

      await expect(
        authService.getProfile('non-existent-id')
      ).rejects.toThrow('Пользователь не найден');
    });
  });
});