const features = [
  {
    title: "AI Diagram Generation",
    description: "Describe a diagram in plain English. Watch it appear on the canvas in real time.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Collaboration",
    description: "See teammates' cursors and edits live. Zero lag. Works across the globe.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Docs + Diagrams, Together",
    description: "Rich text and infinite canvas in one document, always in sync. No more context switching.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Everything you need in one place
        </h2>
        <p className="mt-4 text-surface-400 text-lg max-w-xl mx-auto">
          No more switching between a text editor, a diagram tool, and a whiteboard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative p-8 rounded-2xl border border-surface-800 bg-surface-900/50 hover:bg-surface-900 transition-all"
          >
            <div className="mb-5 text-accent group-hover:scale-110 transition-transform">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
            <p className="text-surface-400 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
