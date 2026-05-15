import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Users, BookOpen, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  // Mock Data
  const stats = [
    { label: 'Total Users', value: '5,245', icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Courses', value: '450', icon: BookOpen, color: 'text-purple-600 bg-purple-100' },
    { label: 'System Health', value: '99.9%', icon: ShieldCheck, color: 'text-green-600 bg-green-100' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Overview</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Settings</h2>
          <div className="text-center py-8 text-gray-500">
            Admin management features coming soon!
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
