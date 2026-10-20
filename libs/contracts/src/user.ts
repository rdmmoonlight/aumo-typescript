// libs/contracts/src/user.ts

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type CreateUserInput = Omit<User, 'id' | 'createdAt'>;