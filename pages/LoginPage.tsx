import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { APP_NAME } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) {
    return <div>Loading authentication context...</div>;
  }

  const { login, currentUser, isLoading } = authContext;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-secondary-100"><LoadingSpinner text="Initializing..." /></div>;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (!email.trim()) {
        setError('Email address is required.');
        setIsSubmitting(false);
        return;
    }
    try {
      const user = await login(email);
      if (user) {
        navigate('/');
      } else {
        setError('Login failed. Your account may not be active, the email domain may not be permitted, or an error occurred. Please contact an administrator.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:shadow-3xl">
        <h1 className="text-3xl font-bold text-center text-primary-700 mb-2">{APP_NAME}</h1>
        <p className="text-center text-secondary-600 mb-8">Sign in to continue</p>
        
        <p className="text-sm text-secondary-500 mb-4 text-center">
          Enter your work email address to sign in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
              Email address (simulates Google Sign-In)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-secondary-300 transition-colors duration-150"
            >
              {isSubmitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Sign in with Google (Simulated)'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-xs text-center text-secondary-500">
          For demo, try: alice@example.com, bob@example.com, charlie@example.com, etc. <br/>
          The system is restricted to a configured domain (default: example.com).
        </p>
      </div>
    </div>
  );
};

export default LoginPage;