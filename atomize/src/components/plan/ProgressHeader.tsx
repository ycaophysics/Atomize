'use client';

interface ProgressHeaderProps {
  completedCount: number;
  totalCount: number;
  streak: number;
}

export function ProgressHeader({ completedCount, totalCount, streak }: ProgressHeaderProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Progress</h2>
          <p className="text-sm text-gray-500">
            {completedCount} of {totalCount} tasks done
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium text-orange-800">{streak} day streak</span>
          </div>
        )}
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAllDone ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isAllDone && (
        <div className="mt-3 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-sm font-medium text-green-600">All done for today!</p>
        </div>
      )}
    </div>
  );
}
