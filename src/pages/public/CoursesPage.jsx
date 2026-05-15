import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import CourseCard from '../../components/CourseCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CATEGORIES, LEVELS, MOCK_COURSES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
  });

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch from API
      const res = await courseApi.getAll();
      setCourses(res.data);
    } catch (err) {
      console.warn('Backend API failed, falling back to mock data for development');
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams();
    if (newFilters.keyword) newParams.set('q', newFilters.keyword);
    if (newFilters.category) newParams.set('category', newFilters.category);
    if (newFilters.level) newParams.set('level', newFilters.level);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ keyword: '', category: '', level: '' });
    setSearchParams(new URLSearchParams());
  };

  // Client-side filtering for demo
  const filteredCourses = courses.filter(course => {
    const matchKeyword = !filters.keyword || course.title.toLowerCase().includes(filters.keyword.toLowerCase()) || course.description?.toLowerCase().includes(filters.keyword.toLowerCase());
    const matchCategory = !filters.category || course.category === filters.category;
    const matchLevel = !filters.level || course.level === filters.level;
    return matchKeyword && matchCategory && matchLevel;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Search Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Explore Our Courses</h1>
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="What do you want to learn today?"
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-white bg-white"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col md:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
        <button 
          className="md:hidden flex items-center justify-center gap-2 btn-secondary py-2"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>

        {/* Sidebar Filters */}
        <aside className={`md:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              {(filters.category || filters.level) && (
                <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">
                  Clear all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Category</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === ''}
                    onChange={() => handleFilterChange('category', '')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  All Categories
                </label>
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={filters.category === cat}
                      onChange={() => handleFilterChange('category', cat)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Level</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="level"
                    checked={filters.level === ''}
                    onChange={() => handleFilterChange('level', '')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  All Levels
                </label>
                {LEVELS.map(level => (
                  <label key={level} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      checked={filters.level === level}
                      onChange={() => handleFilterChange('level', level)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {level.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'result' : 'results'} found
            </h2>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCard key={course.courseId || course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
              <button onClick={clearFilters} className="btn-outline py-2 text-sm">
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CoursesPage;
