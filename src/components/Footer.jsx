import { Link } from 'react-router-dom';
import { GraduationCap, Globe, MessageCircle, Phone, Mail } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">Edu<span className="text-blue-400">Learn</span></span>
          </div>
          <p className="text-sm leading-relaxed mb-4 max-w-xs">
            The modern learning management system built for students, instructors, and institutions.
          </p>
          <div className="flex gap-3">
            {[Globe, MessageCircle, Phone, Mail].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
          <ul className="space-y-2 text-sm">
            {['Courses', 'Instructors', 'Pricing', 'Blog'].map(item => (
              <li key={item}><Link to="#" className="hover:text-white transition-colors">{item}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
          <ul className="space-y-2 text-sm">
            {['Help Center', 'Terms of Service', 'Privacy Policy', 'Contact Us'].map(item => (
              <li key={item}><Link to="#" className="hover:text-white transition-colors">{item}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} EduLearn LMS. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
