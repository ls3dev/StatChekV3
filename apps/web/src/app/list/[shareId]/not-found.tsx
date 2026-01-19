import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background-primary flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-accent-purple mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">List Not Found</h2>
        <p className="text-text-secondary mb-8">
          This list may have been deleted or the link is incorrect.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-accent-purple hover:bg-purple-500 rounded-xl font-semibold transition-colors"
        >
          Go to StatCheck
        </Link>
      </div>
    </main>
  );
}
