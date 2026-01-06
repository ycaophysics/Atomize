'use client';

import { useState } from 'react';
import type { Task, TaskUpdate } from '@/lib/types';

interface TaskDetailProps {
  task: Task;
  childTasks?: Task[];
  onUpdate: (taskId: string, updates: TaskUpdate) => void;
  onComplete: (taskId: string) => void;
  onDefer: (taskId: string) => void;
  onClose: () => void;
}

export function TaskDetail({
  task,
  childTasks = [],
  onUpdate,
  onComplete,
  onDefer,
  onClose,
}: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription || undefined,
    });
    setIsEditing(false);
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-medium">{task.title}</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </button>
              </div>

              {task.description && (
                <p className="text-gray-600 mb-4">{task.description}</p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                  {task.priority} priority
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {task.status}
                </span>
                {task.estimatedMinutes && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ⏱️ {task.estimatedMinutes}m
                  </span>
                )}
              </div>

              {task.deadline && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Deadline: </span>
                  <span className="text-sm font-medium">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              {task.priorityReason && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Why this priority: </span>
                  <span className="text-sm">{task.priorityReason}</span>
                </div>
              )}

              {/* Subtasks */}
              {childTasks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Subtasks</h4>
                  <div className="space-y-2">
                    {childTasks.map((child) => (
                      <div
                        key={child.id}
                        className={`p-2 rounded-lg border ${
                          child.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <span className={child.status === 'completed' ? 'line-through text-gray-500' : ''}>
                          {child.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context */}
              {(task.context.originalGoal || task.context.notes.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Context</h4>
                  {task.context.originalGoal && (
                    <p className="text-sm text-gray-600 mb-2">
                      Original goal: {task.context.originalGoal}
                    </p>
                  )}
                  {task.context.notes.map((note, i) => (
                    <p key={i} className="text-sm text-gray-600">• {note}</p>
                  ))}
                </div>
              )}

              {/* History */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">History</h4>
                <div className="space-y-1">
                  {task.history.slice(-5).map((entry, i) => (
                    <div key={i} className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()} - {entry.details}
                    </div>
                  ))}
                </div>
              </div>

              {/* Original Input */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-500">Original input: </span>
                <span className="italic">&quot;{task.rawInput}&quot;</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && task.status !== 'completed' && (
          <div className="flex gap-2 p-4 border-t">
            <button
              onClick={() => onComplete(task.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ✅ Complete
            </button>
            <button
              onClick={() => onDefer(task.id)}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              📅 Defer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
