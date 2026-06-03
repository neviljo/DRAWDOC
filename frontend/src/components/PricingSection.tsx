const freeFeatures = [
  "Unlimited workspaces",
  "Unlimited documents",
  "Unlimited members per workspace",
  "Full AI features — diagram generation, doc editing, Q&A",
  "All export formats — PNG, PDF, Markdown",
  "Real-time collaboration",
];

export default function PricingSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center p-12 rounded-3xl border border-accent/20 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
          No credit card required
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Open & always free</h2>
        <p className="text-surface-400 mb-8">
          No tiers. No locked features. No upgrade prompts. Just one plan.
        </p>
        <ul className="space-y-3 text-left max-w-sm mx-auto mb-10">
          {freeFeatures.map((f) => (
            <li key={f} className="flex items-start gap-3 text-surface-300">
              <svg className="w-5 h-5 mt-0.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <a
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-soft transition-colors"
        >
          Start for free
        </a>
      </div>
    </section>
  );
}
