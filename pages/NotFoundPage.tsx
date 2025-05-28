
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-secondary-700 mb-2">Page Not Found</h2>
      <p className="text-secondary-500 mb-6">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <img 
        src="https://picsum.photos/seed/404error/400/300" 
        alt="Lost and Confused" 
        className="rounded-lg shadow-md mb-8"
        width="400"
        height="300"
      />
      <Link
        to="/"
        className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-md shadow hover:bg-primary-700 transition-colors"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
