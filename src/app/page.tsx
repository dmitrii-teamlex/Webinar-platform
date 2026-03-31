import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Webinar Platform</h1>
        <p className="text-muted-foreground mb-8">
          AI-powered webinar funnel generation
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
