import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import {
  BookOpen, Menu, X, LogOut, User, LayoutDashboard,
  GraduationCap, Shield, ChevronDown, Brain, CreditCard, Crown, Bell, Clock, Wallet, ClipboardList
} from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardLink =
    role === 'STUDENT' ? '/student/dashboard' :
    role === 'INSTRUCTOR' ? '/instructor/dashboard' :
    role === 'ADMIN' ? '/admin/dashboard' : '/';

  const navLinks = [
    { label: 'Courses', to: '/courses' },
    ...(role === 'STUDENT' ? [
      { label: 'My Learning', to: '/student/courses' },
      { label: 'Subscription', to: '/student/subscriptions', icon: Crown },
      { label: 'Wallet', to: '/student/wallet', icon: Wallet },
    ] : []),
    ...(role === 'INSTRUCTOR' ? [
      { label: 'My Courses', to: '/instructor/courses' },
      { label: 'Quizzes', to: '/instructor/quizzes', icon: Brain },
    ] : []),
    ...(role === 'ADMIN' ? [
      { label: 'Users', to: '/admin/users' },
      { label: 'Courses', to: '/admin/courses' },
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
      { label: 'Refunds', to: '/admin/refund-requests', icon: ClipboardList },
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Edu<span className="text-blue-600">Learn</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.icon && <link.icon className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="relative group mr-2">
                  <NotificationDropdown userId={user?.userId} />
                </div>
                
                <Link
                  to={dashboardLink}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user?.profilePicUrl ? (
                        <img src={user.profilePicUrl} alt={user?.fullName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      ) : null}
                      <span style={{ display: user?.profilePicUrl ? 'none' : 'flex' }}>{getInitials(user?.fullName)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{user?.fullName}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="badge badge-blue mt-1">{role}</span>
                      </div>
                      <Link
                        to={
                          role === 'STUDENT' ? '/student/profile' :
                          role === 'INSTRUCTOR' ? '/instructor/dashboard' :
                          '/admin/dashboard'
                        }
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      {role === 'STUDENT' && (
                        <Link
                          to="/student/wallet"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Wallet className="w-4 h-4" /> Wallet
                        </Link>
                      )}
                      {role === 'ADMIN' && (
                        <Link
                          to="/admin/refund-requests"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" /> Refund Requests
                        </Link>
                      )}
                      <button
                        onClick={() => { setDropdownOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Login</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Sign Up Free</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white py-3 px-4 animate-fade-in">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg mb-1"
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 mt-2">
            {isAuthenticated ? (
              <>
                <Link to={dashboardLink} onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg mb-1">
                  Dashboard
                </Link>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-center text-sm py-2">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center text-sm py-2">Sign Up Free</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NotificationDropdown = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount(userId);
      setUnreadCount(res.data);
    } catch (err) {
      console.error("Failed to fetch notification count", err);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getUnread(userId);
      setNotifications(res.data.slice(0, 5)); // Show only top 5 unread
    } catch (err) {
      console.error("Failed to fetch recent notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    const newState = !open;
    setOpen(newState);
    if (newState) fetchRecentNotifications();
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <Link to="/student/notifications" onClick={() => setOpen(false)} className="text-xs text-blue-600 hover:underline font-semibold">
                View All
              </Link>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
              ) : notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n.notificationId} className="p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer last:border-0">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{n.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-500">
                  <Bell className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No unread notifications</p>
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                 <Link to="/student/notifications" onClick={() => setOpen(false)} className="text-xs font-bold text-gray-600 hover:text-blue-600">
                   Mark all as read
                 </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
