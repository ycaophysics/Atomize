'use client';

import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onComplete, onDefer, onClick }: TaskCardProps) {
  const priorityColors = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-green-500 bg-green-50',
  };

  const priorityBadge = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow ${priorityColors[task.priority]}`}
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>
              {task.priority}
            </span>
            {task.estimatedMinutes && (
              <span className="text-xs text-gray-500">
                ⏱️ {task.estimatedMinutes}m
              </span>
            )}
            {task.deadline && (
              <span className="text-xs text-gray-500">
                ⏰ {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onComplete(task.id)}
            className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            title="Mark complete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => onDefer(task.id)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Defer to tomorrow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar for parent tasks */}
      {task.childIds.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Subtasks</span>
            <span>{task.childIds.length} items</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>
      )}
    </div>
  );
}
