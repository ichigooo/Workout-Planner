import { Link } from "expo-router";

export default function NotFound() {
    return (
        <main className="min-h-dvh bg-[radial-gradient(80%_50%_at_50%_0%,#f7f7f7_0%,#f2f2f2_45%,#efefef_100%)]">
            <div className="mx-auto flex max-w-xl flex-col items-center px-6 pt-28 pb-24 text-center">
                <div className="mb-8 rounded-2xl border border-neutral-200/70 bg-white/70 px-4 py-1.5 text-xs tracking-wider text-neutral-500 backdrop-blur">
                    404 — Page not found
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                    Nothing to see here.
                </h1>

                <p className="mt-3 text-neutral-600 leading-relaxed">
                    The page you’re looking for doesn’t exist or has moved.
                </p>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 transition"
                    >
                        Go back home
                    </Link>
                </div>

                <div className="mt-14 h-px w-24 bg-neutral-200/80" />

                <p className="mt-4 text-xs text-neutral-500">Workout Planner</p>
            </div>
        </main>
    );
}
