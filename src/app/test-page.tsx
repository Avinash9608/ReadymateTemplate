import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page Working!</h1>
        <p className="text-lg mb-4">If you can see this, Next.js is working correctly.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Go to Home
        </Link>
      </div>
    </div>
  );
}
