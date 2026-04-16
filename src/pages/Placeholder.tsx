import { Link } from 'react-router-dom';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-neutral-500">Coming next.</p>
      <Link to="/" className="mt-8 inline-block text-sm text-neutral-500 hover:text-ink">
        ← Back
      </Link>
    </div>
  );
}
