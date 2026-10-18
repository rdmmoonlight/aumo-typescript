import type { User, CreateUserInput } from '@app/contracts';

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }
                                    }
  
