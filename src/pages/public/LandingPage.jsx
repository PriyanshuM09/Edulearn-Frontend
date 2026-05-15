import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star, CheckCircle, Play } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import Footer from '../../components/Footer';
import { MOCK_COURSES } from '../../utils/helpers';

const stats = [
  { icon: BookOpen, label: 'Courses', value: '500+', color: 'text-blue-600 bg-blue-50' },
  { icon: Users, label: 'Students', value: '50,000+', color: 'text-green-600 bg-green-50' },
  { icon: Award, label: 'Certificates', value: '12,000+', color: 'text-purple-600 bg-purple-50' },
  { icon: TrendingUp, label: 'Instructors', value: '200+', color: 'text-amber-600 bg-amber-50' },
];

const features = [
  'Expert-led video courses', 'Certificates on completion',
  'Learn at your own pace', 'Mobile-friendly access',
  'Community support', 'Lifetime course access',
];

const testimonials = [
  { name: 'Alex R.', role: 'Software Engineer', text: 'EduLearn helped me transition from a non-tech background to a full-stack developer in just 6 months!', rating: 5 },
  { name: 'Priya M.', role: 'Data Scientist', text: 'The Python & ML course was incredibly comprehensive. The projects were real-world and portfolio-ready.', rating: 5 },
  { name: 'Jordan K.', role: 'UX Designer', text: 'Best UI/UX design course I\'ve taken. The instructor feedback was genuinely helpful.', rating: 5 },
];

const LandingPage = () => {
  const featured = MOCK_COURSES.filter(c => c.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              🎓 Trusted by 50,000+ learners worldwide
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Learn Skills That <span className="text-yellow-300">Matter</span> for Your Future
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl">
              Join thousands of learners mastering in-demand skills with expert instructors, hands-on projects, and recognized certificates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-lg">
                Explore Courses <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm text-lg">
                <Play className="w-5 h-5" /> Get Started Free
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
              {features.map(f => (
                <span key={f} className="flex items-center gap-2 text-blue-100 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Courses</h2>
              <p className="text-gray-500">Handpicked courses to jumpstart your learning journey</p>
            </div>
            <Link to="/courses" className="hidden md:flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/courses" className="btn-outline">View All Courses</Link>
          </div>
        </div>
      </section>

      {/* Why EduLearn */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose EduLearn?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to succeed in your learning journey</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🎯', title: 'Structured Learning Paths', desc: 'Curated content that takes you from beginner to expert with clear progression.' },
              { icon: '🏆', title: 'Industry Certificates', desc: 'Earn recognized certificates that showcase your skills to employers.' },
              { icon: '👨‍🏫', title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience.' },
            ].map(item => (
              <div key={item.title} className="p-8 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors group">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What Our Students Say</h2>
            <p className="text-gray-500">Join thousands of satisfied learners</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-20 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Start Learning?</h2>
          <p className="text-blue-100 text-lg mb-8">Join 50,000+ learners and start your journey today — it's free!</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-10 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95 text-lg">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
