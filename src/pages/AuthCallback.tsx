import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Extract code and state from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(`Authentication error: ${errorParam}`);
        return;
      }

      if (!code || !state) {
        setError('Missing authorization code or state');
        return;
      }

      try {
        if (auth.handleAuthCallback) {
          const success = await auth.handleAuthCallback(code, state);
          if (success) {
            // Redirect to operator dashboard
            navigate('/dashboard', { replace: true });
          } else {
            setError('Failed to authenticate. Please try again.');
          }
        } else {
          setError('Authentication handler not available');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An error occurred during authentication');
      }
    };

    handleCallback();
  }, [navigate, auth]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Completing authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
}
