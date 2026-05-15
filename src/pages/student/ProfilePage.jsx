import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { User, Mail, Shield, Save, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { walletApi } from '../../api/walletApi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser, role } = useAuth();
  const [formData, setFormData] = useState({ fullName: '', email: '', bio: '', profilePicUrl: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (user && role === 'STUDENT') {
      walletApi.getWallet(user.userId).then(res => setWalletBalance(res.data.balance));
    }
  }, [user, role]);

  useEffect(() => {
    if (user) {
      setFormData({ 
        fullName: user.fullName || '', 
        email: user.email || '',
        bio: user.bio || '',
        profilePicUrl: user.profilePicUrl || '',
        mobile: user.mobile || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.updateProfile(user.userId, {
        fullName: formData.fullName,
        bio: formData.bio,
        profilePicUrl: formData.profilePicUrl,
        mobile: formData.mobile ? parseInt(formData.mobile) : null
      });
      updateUser(formData);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {user?.profilePicUrl ? (
                <img src={user.profilePicUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.[0]
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-blue-500" /> {role}
              </p>
            </div>
          </div>

          {role === 'STUDENT' && (
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Wallet Balance</p>
                  <p className="text-2xl font-black">₹{walletBalance.toLocaleString()}</p>
                </div>
              </div>
              <Link to="/student/wallet" className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-sm border border-white/20">
                Manage Wallet <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input-field pl-10"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="input-field pl-10"
                  value={formData.email}
                  disabled
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="label">Mobile Number</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 9876543210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Profile Picture URL</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://example.com/avatar.jpg"
                value={formData.profilePicUrl}
                onChange={(e) => setFormData({ ...formData, profilePicUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
