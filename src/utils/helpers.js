export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatPrice = (price) => {
  if (!price || price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
};

export const getLevelColor = (level) => {
  const map = {
    BEGINNER: 'badge-green',
    INTERMEDIATE: 'badge-yellow',
    ADVANCED: 'badge-red',
    ALL_LEVELS: 'badge-blue',
  };
  return map[level] || 'badge-blue';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const truncate = (str, n = 100) => {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
};

export const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'Cloud Computing', 'Cybersecurity', 'DevOps', 'UI/UX Design',
  'Business', 'Marketing', 'Finance', 'Photography', 'Music'
];

export const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];

export const MOCK_COURSES = [
  {
    id: 1, title: 'Complete React Developer in 2024', instructor: 'John Doe',
    instructorId: 101, category: 'Web Development', level: 'BEGINNER',
    price: 49.99, rating: 4.8, enrollmentCount: 12450, duration: 360,
    thumbnail: null, description: 'Master React from scratch with hooks, context, Redux and more.',
    featured: true, published: true,
  },
  {
    id: 2, title: 'Python for Data Science & ML', instructor: 'Jane Smith',
    instructorId: 102, category: 'Data Science', level: 'INTERMEDIATE',
    price: 59.99, rating: 4.9, enrollmentCount: 23100, duration: 480,
    thumbnail: null, description: 'Learn Python, Pandas, NumPy, Matplotlib, Scikit-Learn.',
    featured: true, published: true,
  },
  {
    id: 3, title: 'AWS Certified Solutions Architect', instructor: 'Mike Johnson',
    instructorId: 103, category: 'Cloud Computing', level: 'ADVANCED',
    price: 79.99, rating: 4.7, enrollmentCount: 8750, duration: 420,
    thumbnail: null, description: 'Prepare for the AWS SAA-C03 certification exam.',
    featured: true, published: true,
  },
  {
    id: 4, title: 'Full Stack Web Development Bootcamp', instructor: 'Sarah Lee',
    instructorId: 104, category: 'Web Development', level: 'BEGINNER',
    price: 0, rating: 4.6, enrollmentCount: 34200, duration: 600,
    thumbnail: null, description: 'HTML, CSS, JavaScript, Node.js, Express, MongoDB and more.',
    featured: true, published: true,
  },
  {
    id: 5, title: 'UI/UX Design Masterclass', instructor: 'Emma Wilson',
    instructorId: 105, category: 'UI/UX Design', level: 'BEGINNER',
    price: 39.99, rating: 4.5, enrollmentCount: 9800, duration: 240,
    thumbnail: null, description: 'Learn Figma, design principles, and build a portfolio.',
    featured: false, published: true,
  },
  {
    id: 6, title: 'Docker & Kubernetes for Developers', instructor: 'Tom Brown',
    instructorId: 106, category: 'DevOps', level: 'INTERMEDIATE',
    price: 54.99, rating: 4.8, enrollmentCount: 7600, duration: 300,
    thumbnail: null, description: 'Containerize apps and orchestrate with Kubernetes.',
    featured: false, published: true,
  },
];

export const MOCK_LESSONS = [
  { id: 1, title: 'Introduction & Setup', duration: 15, order: 1, free: true, type: 'VIDEO' },
  { id: 2, title: 'Core Concepts', duration: 30, order: 2, free: false, type: 'VIDEO' },
  { id: 3, title: 'Hands-on Practice', duration: 45, order: 3, free: false, type: 'VIDEO' },
  { id: 4, title: 'Advanced Techniques', duration: 60, order: 4, free: false, type: 'VIDEO' },
  { id: 5, title: 'Project Walkthrough', duration: 90, order: 5, free: false, type: 'VIDEO' },
  { id: 6, title: 'Quiz & Assessment', duration: 20, order: 6, free: false, type: 'QUIZ' },
];
