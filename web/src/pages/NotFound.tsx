import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-2xl">העמוד לא נמצא</h1>
      <Link to="/" className="mt-4 inline-block underline">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
