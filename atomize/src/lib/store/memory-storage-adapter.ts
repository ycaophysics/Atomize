import type { SerializedTask } from '@/lib/types';
import type { StorageAdapter } from './task-store';

// In-memory storage adapter for testing
export class MemoryStorageAdapter implements StorageAdapter {
  private data: SerializedTask[] = [];

  async load(): Promise<SerializedTask[]> {
    return [...this.data];
  }

  async save(tasks: SerializedTask[]): Promise<void> {
    this.data = [...tasks];
  }

  clear(): void {
    this.data = [];
  }

  getData(): SerializedTask[] {
    return [...this.data];
  }
}
