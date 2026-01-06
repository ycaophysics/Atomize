'use client';

import type { Task } from '@/lib/types';
import type { Plan } from '@/lib/managers';
import { ProgressHeader } from './ProgressHeader';
import { TaskSection } from './TaskSection';

interface PlanViewProps {
  todayPlan: Plan;
  upcomingTasks: Task[];
  laterTasks: Task[];
  streak: number;
  onComplete: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function PlanView({
  todayPlan,
  upcomingTasks,
  laterTasks,
  streak,
  onComplete,
  onDefer,
  onTaskClick,
}: PlanViewProps) {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <ProgressHeader
        completedCount={todayPlan.completedCount}
        totalCount={todayPlan.totalCount}
        streak={streak}
      />

      <TaskSection
        title="Today"
        tasks={todayPlan.tasks}
        onComplete={onComplete}
        onDefer={onDefer}
        onTaskClick={onTaskClick}
      />

      <TaskSection
        title="Upcoming"
        tasks={upcomingTasks}
        onComplete={onComplete}
        onDefer={onDefer}
        onTaskClick={onTaskClick}
      />

      <TaskSection
        title="Later"
        tasks={laterTasks}
        defaultCollapsed={true}
        onComplete={onComplete}
        onDefer={onDefer}
        onTaskClick={onTaskClick}
      />

      {todayPlan.tasks.length === 0 && upcomingTasks.length === 0 && laterTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500">
            Start by adding a task in the chat!
          </p>
        </div>
      )}
    </div>
  );
}
