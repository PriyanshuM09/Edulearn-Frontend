import { Link } from 'react-router-dom';
import { Star, Users, Clock, BookOpen } from 'lucide-react';
import { formatPrice, getLevelColor, truncate, formatDuration } from '../utils/helpers';

const CourseCard = ({ course, onClick }) => {
  const {
    id, courseId, title, instructor, instructorId, category, level, price,
    rating = 4.5, enrollmentCount = 0, duration, totalDuration, thumbnail, thumbnailUrl, description
  } = course;

  const actualId = courseId || id;
  const actualDuration = totalDuration || duration;
  const actualThumbnail = thumbnailUrl || thumbnail;

  const CategoryColors = {
    'Web Development': 'bg-blue-50 text-blue-600',
    'Data Science': 'bg-purple-50 text-purple-600',
    'Machine Learning': 'bg-pink-50 text-pink-600',
    'Cloud Computing': 'bg-cyan-50 text-cyan-600',
    'DevOps': 'bg-orange-50 text-orange-600',
    'UI/UX Design': 'bg-rose-50 text-rose-600',
    'Cybersecurity': 'bg-red-50 text-red-600',
  };
  const catColor = CategoryColors[category] || 'bg-gray-50 text-gray-600';

  return (
    <Link
      to={`/courses/${actualId}`}
      className="card group flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden flex-shrink-0">
        {actualThumbnail ? (
          <img src={actualThumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white opacity-80">
            <BookOpen className="w-12 h-12 mb-2" />
            <span className="text-xs font-medium text-center px-4">{category}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`badge text-xs font-semibold ${catColor}`}>{category}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`badge ${getLevelColor(level)}`}>{level?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{truncate(description, 80)}</p>

        <p className="text-xs text-gray-500 mb-3">
          by <span className="font-medium text-gray-700">{instructor || `Instructor #${instructorId}`}</span>
        </p>

        {/* Rating & stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            {rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {enrollmentCount.toLocaleString()}
          </span>
          {actualDuration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(actualDuration)}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto">
          <span className={`text-lg font-bold ${price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
