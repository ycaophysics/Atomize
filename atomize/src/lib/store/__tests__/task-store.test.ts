import { TaskStore } from '../task-store';
import { MemoryStorageAdapter } from '../memory-storage-adapter';
import type { TaskInput, TaskUpdate } from '@/lib/types';

describe('TaskStore', () => {
  let store: TaskStore;
  let storage: MemoryStorageAdapter;

  beforeEach(async () => {
    storage = new MemoryStorageAdapter();
    store = new TaskStore(storage);
    await store.initialize();
  });

  describe('create', () => {
    it('should create a task with all required fields', async () => {
      const input: TaskInput = {
        rawInput: 'Write unit tests for TaskStore',
      };

      const task = await store.create(input);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Write unit tests for TaskStore');
      expect(task.rawInput).toBe(input.rawInput);
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
      expect(task.history.length).toBe(1);
      expect(task.history[0].action).toBe('created');
    });

    it('should persist task to storage', async () => {
      const input: TaskInput = { rawInput: 'Test persistence' };
      await store.create(input);

      const data = storage.getData();
      expect(data.length).toBe(1);
      expect(data[0].rawInput).toBe('Test persistence');
    });

    it('should link child to parent', async () => {
      const parent = await store.create({ rawInput: 'Parent task' });
      const child = await store.create({ rawInput: 'Child task', parentId: parent.id });

      const updatedParent = store.get(parent.id);
      expect(updatedParent?.childIds).toContain(child.id);
      expect(child.parentId).toBe(parent.id);
      expect(child.context.parentContext).toBe(parent.title);
    });
  });

  describe('get', () => {
    it('should return task by id', async () => {
      const created = await store.create({ rawInput: 'Test task' });
      const retrieved = store.get(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent id', () => {
      const result = store.get('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should throw error when explicit is false', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      const updates: TaskUpdate = { title: 'Updated title' };

      await expect(store.update(task.id, updates, false)).rejects.toThrow(
        'Task modifications require explicit user request'
      );
    });

    it('should update task when explicit is true', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      const updates: TaskUpdate = { title: 'Updated title' };

      const updated = await store.update(task.id, updates, true);

      expect(updated.title).toBe('Updated title');
      expect(updated.history.length).toBe(2);
      expect(updated.history[1].action).toBe('updated');
    });

    it('should record previous and new values in history', async () => {
      const task = await store.create({ rawInput: 'Original title' });
      const updates: TaskUpdate = { title: 'New title' };

      const updated = await store.update(task.id, updates, true);
      const historyEntry = updated.history[1];

      expect(historyEntry.previousValue).toBe('Original title');
      expect(historyEntry.newValue).toBe('New title');
    });
  });

  describe('complete', () => {
    it('should mark task as completed', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      const completed = await store.complete(task.id);

      expect(completed.status).toBe('completed');
      expect(completed.history.length).toBe(2);
      expect(completed.history[1].action).toBe('completed');
    });

    it('should preserve task data after completion', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      await store.complete(task.id);

      const retrieved = store.get(task.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.rawInput).toBe('Test task');
    });
  });

  describe('defer', () => {
    it('should reschedule task to tomorrow by default', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      const deferred = await store.defer(task.id);

      expect(deferred.status).toBe('deferred');
      expect(deferred.scheduledDate).toBeDefined();
      expect(deferred.scheduledDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reschedule to specified date', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const deferred = await store.defer(task.id, futureDate);

      expect(deferred.scheduledDate?.getTime()).toBe(futureDate.getTime());
    });
  });

  describe('delete', () => {
    it('should throw error when explicit is false', async () => {
      const task = await store.create({ rawInput: 'Test task' });

      await expect(store.delete(task.id, false)).rejects.toThrow(
        'Task deletion requires explicit user request'
      );
    });

    it('should delete task when explicit is true', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      await store.delete(task.id, true);

      expect(store.get(task.id)).toBeNull();
    });

    it('should remove from parent childIds', async () => {
      const parent = await store.create({ rawInput: 'Parent' });
      const child = await store.create({ rawInput: 'Child', parentId: parent.id });

      await store.delete(child.id, true);

      const updatedParent = store.get(parent.id);
      expect(updatedParent?.childIds).not.toContain(child.id);
    });
  });

  describe('getAll', () => {
    it('should return all tasks', async () => {
      await store.create({ rawInput: 'Task 1' });
      await store.create({ rawInput: 'Task 2' });
      await store.create({ rawInput: 'Task 3' });

      const tasks = store.getAll();
      expect(tasks.length).toBe(3);
    });

    it('should filter by status', async () => {
      await store.create({ rawInput: 'Task 1' });
      const task2 = await store.create({ rawInput: 'Task 2' });
      await store.complete(task2.id);

      const pending = store.getAll({ status: ['pending'] });
      const completed = store.getAll({ status: ['completed'] });

      expect(pending.length).toBe(1);
      expect(completed.length).toBe(1);
    });

    it('should filter by priority', async () => {
      await store.create({ rawInput: 'Task 1', priority: 'high' });
      await store.create({ rawInput: 'Task 2', priority: 'low' });

      const highPriority = store.getAll({ priority: ['high'] });
      expect(highPriority.length).toBe(1);
      expect(highPriority[0].priority).toBe('high');
    });
  });

  describe('exportJSON', () => {
    it('should export tasks as valid JSON', async () => {
      await store.create({ rawInput: 'Task 1' });
      await store.create({ rawInput: 'Task 2' });

      const json = store.exportJSON();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
  });

  describe('history append-only', () => {
    it('should never decrease history length', async () => {
      const task = await store.create({ rawInput: 'Test task' });
      const initialLength = task.history.length;

      const updated = await store.update(task.id, { title: 'New title' }, true);
      expect(updated.history.length).toBeGreaterThanOrEqual(initialLength);

      const completed = await store.complete(task.id);
      expect(completed.history.length).toBeGreaterThanOrEqual(updated.history.length);
    });
  });
});
