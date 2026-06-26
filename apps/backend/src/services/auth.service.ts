import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60; 

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning();

    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  async login(email: string, password: string) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Неверный email или пароль');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Неверный email или пароль');
    }

    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  async getProfile(userId: string) {
    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return user;
  }

  private generateToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'USER',
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}

export const authService = new AuthService();