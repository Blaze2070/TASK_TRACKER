jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn(() => ({
    sendPushNotificationsAsync: jest.fn(),
  })),
  isExpoPushToken: jest.fn(),
  ExpoPushMessage: jest.fn(),
}));

jest.mock('../src/services/notification.service', () => ({
  notificationService: {
    registerPushToken: jest.fn(),
    sendPushNotification: jest.fn(),
    sendTaskDueSoonNotifications: jest.fn(),
  },
}));

jest.mock('../src/db', () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
      orderBy: jest.fn().mockResolvedValue([]),
    }),
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([]),
    }),
  });

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockResolvedValue(undefined),
  });

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
    },
    schema: {
      tasks: {
        id: 'id',
        title: 'title',
        description: 'description',
        status: 'status',
        priority: 'priority',
        progress: 'progress',
        dueDate: 'due_date',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        userId: 'user_id',
      },
      pushTokens: {
        token: 'token',
        userId: 'user_id',
      },
    },
  };
});
