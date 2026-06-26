export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress: number;
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}