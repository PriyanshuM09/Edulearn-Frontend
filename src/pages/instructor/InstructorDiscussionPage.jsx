import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import DiscussionBoard from '../../components/DiscussionBoard';

const InstructorDiscussionPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/instructor/courses')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Courses
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Discussion Forum</h1>
              <p className="text-sm text-gray-500">Monitor student questions and provide expert guidance.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <DiscussionBoard courseId={courseId} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InstructorDiscussionPage;
