export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-surface-700 bg-surface-900/50 text-sm text-surface-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Real-time collaborative editing
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Diagrams and docs.
          <br />
          <span className="text-accent">Together. Live.</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
          DrawDoc combines a rich-text editor and an infinite drawing canvas with AI-powered diagram
          generation — all synced in real time with your team.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-soft transition-colors"
          >
            Start for free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-surface-700 text-surface-200 font-semibold hover:bg-surface-800 transition-colors"
          >
            See it live
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
