import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-walmart-blue mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-walmart inline-flex items-center gap-2">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
