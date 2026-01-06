'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  defaultCollapsed?: boolean;
  onComplete: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskSection({
  title,
  tasks,
  defaultCollapsed = false,
  onComplete,
  onDefer,
  onTaskClick,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full mb-3"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({tasks.length})
          </span>
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {!isCollapsed && (
        <div>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDefer={onDefer}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
