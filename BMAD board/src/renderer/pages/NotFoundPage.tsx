import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-6xl font-bold text-foreground-tertiary mb-4">404</h1>
      <p className="text-xl text-foreground-secondary mb-6">Page not found</p>
      <Link
        to="/"
        className="px-4 py-2 bg-accent text-foreground-on-accent rounded hover:bg-accent-hover transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
