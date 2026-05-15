import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CATEGORIES, LEVELS } from '../../utils/helpers';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../../api/courseApi';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: CATEGORIES[0], level: LEVELS[0], price: 0, thumbnailUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await courseApi.create({
        ...formData,
        instructorId: user.userId,
        price: parseFloat(formData.price)
      });
      toast.success('Course created successfully!');
      navigate('/instructor/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Course</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Course Title</label>
              <input type="text" className="input-field" required 
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Advanced Web Development" />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input-field min-h-[120px]" required
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="What will students learn?" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Level</label>
                <select className="input-field" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                  {LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Price (₹)</label>
              <input type="number" min="0" step="0.01" className="input-field" required
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>

            <div>
              <label className="label">Course Thumbnail URL</label>
              <input type="text" className="input-field"
                value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                placeholder="https://example.com/thumbnail.jpg" />
              <p className="text-xs text-gray-400 mt-1">Provide a URL for the course thumbnail image.</p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
              <button type="button" onClick={() => navigate('/instructor/courses')} className="btn-secondary" disabled={loading}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateCoursePage;
