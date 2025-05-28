import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PostContext } from '../contexts/PostContext';
import { Post, PostStatus } from '../types';
import { POST_STATUS_COLORS } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon as PageIcon } from '../components/icons/IconComponents';

const CalendarPage: React.FC = () => {
  const postContext = useContext(PostContext);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (postContext && postContext.posts.length === 0 && !postContext.isLoading) {
      postContext.fetchPosts();
    }
  }, [postContext]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
  const lastDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), [currentDate]);

  const daysInMonth = useMemo(() => {
    const days = [];
    const firstDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const numDays = lastDayOfMonth.getDate();

    // Add leading empty cells for days from previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add days of the current month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [firstDayOfMonth, lastDayOfMonth, currentDate]);

  const postsByDate = useMemo(() => {
    if (!postContext || !postContext.posts) return {};
    const grouped: Record<string, Post[]> = {};
    postContext.posts.forEach(post => {
      if (post.publicationDate) {
        const dateKey = new Date(post.publicationDate).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(post);
      }
    });
    return grouped;
  }, [postContext]);


  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  if (!postContext || postContext.isLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading calendar..." /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-xl rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-secondary-800 flex items-center mb-3 sm:mb-0">
          <PageIcon className="w-7 h-7 mr-2 text-primary-600" />
          Posts Calendar
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-md hover:bg-secondary-100 text-secondary-600 hover:text-secondary-800 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-secondary-700 w-40 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-md hover:bg-secondary-100 text-secondary-600 hover:text-secondary-800 transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border border-secondary-200 bg-secondary-200 rounded-md overflow-hidden">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-center font-medium text-sm text-secondary-600 bg-secondary-100">
            {day}
          </div>
        ))}
        {daysInMonth.map((day, index) => {
          const dateKey = day ? day.toDateString() : '';
          const postsForDay = day ? (postsByDate[dateKey] || []) : [];
          const isToday = day && day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={day ? day.toISOString() : `empty-${index}`}
              className={`p-2 min-h-[120px] bg-white ${day ? 'hover:bg-secondary-50' : 'bg-secondary-50 opacity-50'} transition-colors relative`}
            >
              {day && (
                <>
                  <span className={`text-sm font-semibold ${isToday ? 'text-primary-600 bg-primary-100 rounded-full px-1.5 py-0.5' : 'text-secondary-700'}`}>
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {postsForDay.map(post => (
                      <Link
                        key={post.id}
                        to={`/posts/${post.id}/edit`}
                        className={`block p-1.5 rounded text-xs truncate ${POST_STATUS_COLORS[post.status]} hover:opacity-80 transition-opacity`}
                        title={post.title}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${POST_STATUS_COLORS[post.status].split(' ')[0].replace('bg-','border-').replace('-200','-500')} border-2`}></span>
                        {post.title}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarPage;