import type { SerializedTask } from '@/lib/types';
import type { StorageAdapter } from './task-store';

const STORAGE_KEY = 'atomize_tasks';

export class LocalStorageAdapter implements StorageAdapter {
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async load(): Promise<SerializedTask[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as SerializedTask[];
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
      return [];
    }
  }

  async save(tasks: SerializedTask[]): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
      throw new Error('Failed to persist tasks');
    }
  }

  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(this.storageKey);
  }
}
