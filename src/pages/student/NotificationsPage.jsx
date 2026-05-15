import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Bell, BellOff, Check, Trash2, Mail, Info, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getByRecipient(user.userId);
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead(user.userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'EMAIL': return <Mail className="w-5 h-5 text-blue-500" />;
      case 'ALERT': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">Stay updated with course activities and announcements</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : notifications.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <div 
                  key={notification.notificationId} 
                  className={`p-6 flex gap-4 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50/40'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`font-bold text-gray-900 ${notification.read ? '' : 'text-blue-900'}`}>
                        {notification.title}
                      </h4>
                      <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{notification.message}</p>
                    <div className="flex items-center gap-4">
                      {!notification.read && (
                        <button 
                          onClick={() => handleMarkRead(notification.notificationId)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(notification.notificationId)}
                        className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BellOff className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto">When you receive notifications, they'll show up here.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
