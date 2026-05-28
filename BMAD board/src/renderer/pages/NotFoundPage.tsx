import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-6">Page not found</p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
