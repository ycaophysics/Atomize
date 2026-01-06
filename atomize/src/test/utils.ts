import * as fc from 'fast-check';
import type { Task, PriorityLevel, TaskStatus } from '@/lib/types';

// Arbitrary generators for property-based testing

export const priorityArbitrary = fc.constantFrom<PriorityLevel>('high', 'medium', 'low');

export const taskStatusArbitrary = fc.constantFrom<TaskStatus>(
  'pending',
  'in_progress',
  'completed',
  'deferred',
  'archived'
);

export const dateInFutureArbitrary = (maxDays = 30) =>
  fc.integer({ min: 1, max: maxDays * 24 * 60 * 60 * 1000 }).map((ms) => new Date(Date.now() + ms));

export const dateInPastArbitrary = (maxDays = 30) =>
  fc.integer({ min: 1, max: maxDays * 24 * 60 * 60 * 1000 }).map((ms) => new Date(Date.now() - ms));

export const taskArbitrary: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  rawInput: fc.string({ minLength: 1, maxLength: 500 }),
  parentId: fc.option(fc.uuid(), { nil: undefined }),
  childIds: fc.array(fc.uuid(), { maxLength: 10 }),
  deadline: fc.option(dateInFutureArbitrary(), { nil: undefined }),
  scheduledDate: fc.option(fc.date(), { nil: undefined }),
  estimatedMinutes: fc.option(fc.integer({ min: 5, max: 480 }), { nil: undefined }),
  priority: priorityArbitrary,
  priorityReason: fc.string({ minLength: 1, maxLength: 200 }),
  status: taskStatusArbitrary,
  context: fc.record({
    originalGoal: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    parentContext: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    notes: fc.array(fc.string({ maxLength: 100 }), { maxLength: 5 }),
    relatedTaskIds: fc.array(fc.uuid(), { maxLength: 5 }),
  }),
  history: fc.array(
    fc.record({
      timestamp: fc.date(),
      action: fc.constantFrom('created', 'updated', 'completed', 'deferred', 'rescheduled'),
      details: fc.string({ maxLength: 200 }),
      previousValue: fc.option(fc.anything(), { nil: undefined }),
      newValue: fc.option(fc.anything(), { nil: undefined }),
    }),
    { maxLength: 10 }
  ),
});

export const naturalDateArbitrary = fc.oneof(
  fc.constant('tomorrow'),
  fc.constant('next week'),
  fc.constant('in 3 days'),
  fc.constant('next Monday'),
  fc.constant('next Friday'),
  fc.tuple(fc.constantFrom('in'), fc.integer({ min: 1, max: 30 }), fc.constantFrom('days', 'weeks')).map(
    ([prefix, num, unit]) => `${prefix} ${num} ${unit}`
  )
);

export const brainDumpArbitrary = fc
  .array(
    fc.oneof(
      fc.string({ minLength: 5, maxLength: 100 }),
      fc.constantFrom(
        'need to finish the report',
        'call mom',
        'prepare for meeting tomorrow',
        'buy groceries - milk, eggs, bread',
        'review pull request',
        'send invoice to client'
      )
    ),
    { minLength: 1, maxLength: 10 }
  )
  .map((items) => items.join('. '));

// Test helpers

export function createMockTask(overrides: Partial<Task> = {}): Task {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: 'Test Task',
    rawInput: 'Test task input',
    childIds: [],
    priority: 'medium',
    priorityReason: 'Default priority',
    status: 'pending',
    context: {
      notes: [],
      relatedTaskIds: [],
    },
    history: [
      {
        timestamp: now,
        action: 'created',
        details: 'Task created',
      },
    ],
    ...overrides,
  };
}

export function createTaskWithDeadline(hoursFromNow: number, overrides: Partial<Task> = {}): Task {
  const deadline = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return createMockTask({
    deadline,
    ...overrides,
  });
}

export function createTaskScheduledFor(date: Date, overrides: Partial<Task> = {}): Task {
  return createMockTask({
    scheduledDate: date,
    ...overrides,
  });
}

export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export function getDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}
