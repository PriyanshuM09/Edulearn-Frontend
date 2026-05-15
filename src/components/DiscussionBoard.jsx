import { useState, useEffect } from 'react';
import { discussionApi } from '../api/discussionApi';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, Pin, Search, Plus, Send, User, CheckCircle, 
  ChevronRight, MessageCircle, X, Lock, Unlock, AlertCircle, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const DiscussionBoard = ({ courseId }) => {
  const { user, isInstructor } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchThreads();
  }, [courseId]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await discussionApi.getThreadsByCourse(courseId);
      setThreads(res.data);
    } catch (err) {
      console.warn("Failed to fetch threads, using mock data", err);
      setThreads([
        { threadId: 1, title: "How to handle state?", content: "I'm having trouble with complex state management.", studentName: "John Doe", createdAt: new Date().toISOString(), replyCount: 3, pinned: true },
        { threadId: 2, title: "Next.js vs Vite", content: "Which one should I use for my next project?", studentName: "Jane Smith", createdAt: new Date().toISOString(), replyCount: 1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThread.title || !newThread.content) return;

    try {
      await discussionApi.createThread({
        courseId,
        authorId: user.userId,
        authorRole: user.role,
        authorName: user.fullName,
        title: newThread.title,
        content: newThread.content
      });
      toast.success('Discussion thread created!');
      setNewThread({ title: '', content: '' });
      setShowCreate(false);
      fetchThreads();
    } catch (err) {
      toast.error('Failed to create thread');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      fetchThreads();
      return;
    }
    setLoading(true);
    try {
      const res = await discussionApi.searchThreads(courseId, searchQuery);
      setThreads(res.data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  if (selectedThread) {
    return <ThreadDetail threadId={selectedThread.threadId} onBack={() => { setSelectedThread(null); fetchThreads(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center gap-2"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Question'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Ask a Question</h3>
          <form onSubmit={handleCreateThread} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                placeholder="Be specific with your question"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newThread.title}
                onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
              <textarea
                rows="4"
                placeholder="Provide context and explain what you've tried..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newThread.content}
                onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary px-6">Post Question</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : threads.length > 0 ? (
          threads.map(thread => (
            <div
              key={thread.threadId}
              onClick={() => setSelectedThread(thread)}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.pinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {thread.title}
                    </h4>
                    {thread.closed && <span className="badge badge-gray">Closed</span>}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{thread.content}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium text-gray-700 flex items-center gap-1">
                      {thread.authorName}
                      {thread.authorRole === 'INSTRUCTOR' && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" /> Instructor
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {thread.replyCount} replies
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-gray-900">No discussions yet</h4>
            <p className="text-gray-500">Be the first to ask a question in this course!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ThreadDetail = ({ threadId, onBack }) => {
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    fetchThreadData();
  }, [threadId]);

  const fetchThreadData = async () => {
    setLoading(true);
    try {
      const [threadRes, repliesRes] = await Promise.all([
        discussionApi.getThreadById(threadId),
        discussionApi.getRepliesByThread(threadId)
      ]);
      setThread(threadRes.data);
      setReplies(repliesRes.data);
    } catch (err) {
      toast.error('Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      await discussionApi.addReply({
        threadId,
        authorId: user.userId,
        authorRole: user.role,
        authorName: user.fullName,
        content: newReply
      });
      setNewReply('');
      fetchThreadData();
      toast.success('Reply posted!');
    } catch (err) {
      toast.error('Failed to post reply');
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 font-medium">
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back to Discussions
      </button>

      {/* Main Thread Question */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex gap-4 items-start mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {thread.authorName?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{thread.title}</h2>
              {thread.authorRole === 'INSTRUCTOR' && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  Instructor Announcement
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-semibold text-gray-900 flex items-center gap-1">
                {thread.authorName}
                {thread.authorRole === 'INSTRUCTOR' && <Shield className="w-3.5 h-3.5 text-blue-600" />}
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Moderation Controls */}
        {useAuth().isInstructor && (
          <div className="flex gap-2 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <button 
              onClick={async () => {
                try {
                  if (thread.isPinned) await discussionApi.unpinThread(threadId);
                  else await discussionApi.pinThread(threadId);
                  toast.success(thread.isPinned ? 'Thread unpinned' : 'Thread pinned');
                  fetchThreadData();
                } catch { toast.error('Moderation failed'); }
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                thread.isPinned ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Pin className={`w-4 h-4 ${thread.isPinned ? 'fill-amber-700' : ''}`} />
              {thread.isPinned ? 'Unpin' : 'Pin Thread'}
            </button>
            
            {thread.status !== 'CLOSED' && (
              <button 
                onClick={async () => {
                  try {
                    await discussionApi.closeThread(threadId);
                    toast.success('Thread closed');
                    fetchThreadData();
                  } catch { toast.error('Moderation failed'); }
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-600 border border-gray-200"
              >
                <Lock className="w-4 h-4" />
                Close Thread
              </button>
            )}
          </div>
        )}

        <div className="prose max-w-none text-gray-700 leading-relaxed">
          {thread.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </div>

      {/* Replies List */}
      <div className="space-y-6">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          {replies.length} Replies
        </h3>
        
        {replies.map(reply => (
          <div key={reply.replyId} className={`bg-white border rounded-xl p-5 shadow-sm ${reply.accepted ? 'border-green-300 ring-1 ring-green-100' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                  {reply.authorName?.[0]}
                </div>
                <div>
                  <span className="font-bold text-sm text-gray-900 flex items-center gap-1">
                    {reply.authorName}
                    {reply.authorRole === 'INSTRUCTOR' && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0 rounded font-bold">
                        Instructor
                      </span>
                    )}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {reply.accepted && (
                <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Best Answer
                </div>
              )}
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      {!thread.closed && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-4">Your Answer</h4>
          <form onSubmit={handlePostReply} className="space-y-4">
            <textarea
              rows="4"
              placeholder="Share your thoughts or help others..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              required
            ></textarea>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary px-8 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Post Answer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DiscussionBoard;
