import * as fc from 'fast-check';
import { createMockTask, taskArbitrary, priorityArbitrary } from '@/test/utils';
import type { PriorityLevel } from '@/lib/types';

describe('Test Infrastructure', () => {
  it('should create a valid mock task', () => {
    const task = createMockTask();
    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('pending');
    expect(task.history.length).toBeGreaterThan(0);
  });

  it('should generate valid tasks with fast-check', () => {
    fc.assert(
      fc.property(taskArbitrary, (task) => {
        expect(task.id).toBeDefined();
        expect(task.title.length).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(task.priority);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid priorities', () => {
    fc.assert(
      fc.property(priorityArbitrary, (priority: PriorityLevel) => {
        expect(['high', 'medium', 'low']).toContain(priority);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
