import { PlayCircle, Lock, FileText, HelpCircle, CheckCircle } from 'lucide-react';
import { formatDuration } from '../utils/helpers';

const typeIcons = {
  VIDEO: PlayCircle,
  DOCUMENT: FileText,
  QUIZ: HelpCircle,
};

const LessonList = ({ lessons = [], completedIds = [], onLessonClick, isEnrolled }) => {
  if (!lessons.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No lessons yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {lessons.map((lesson, idx) => {
        const Icon = typeIcons[lesson.type] || PlayCircle;
        const isCompleted = completedIds.includes(lesson.id);
        const isAccessible = lesson.free || isEnrolled;

        return (
          <button
            key={lesson.id || lesson.lessonId || idx}
            onClick={() => isAccessible && onLessonClick?.(lesson)}
            disabled={!isAccessible}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors group ${
              isAccessible
                ? 'hover:bg-blue-50 cursor-pointer'
                : 'cursor-not-allowed opacity-60'
            } ${isCompleted ? 'bg-green-50' : 'bg-white border border-gray-100'}`}
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </span>
            <span className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : isAccessible ? (
                <Icon className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className={`text-sm font-medium block truncate ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                {lesson.title}
              </span>
              {lesson.free && !isEnrolled && (
                <span className="text-xs text-blue-600 font-medium">Free Preview</span>
              )}
            </span>
            {lesson.duration && (
              <span className="flex-shrink-0 text-xs text-gray-400">
                {formatDuration(lesson.duration)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default LessonList;
