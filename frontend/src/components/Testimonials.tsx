const testimonials = [
  {
    name: "Aisha Kapoor",
    role: "Staff Engineer",
    company: "Stripe",
    quote:
      "We use DrawDoc for every system design review. The AI diagram generation alone saves us hours per sprint.",
    initials: "AK",
    color: "bg-blue-500",
  },
  {
    name: "Marcus Chen",
    role: "Product Designer",
    company: "Figma",
    quote:
      "The real-time sync is incredible. I can watch my PM's cursor dance across the canvas as they review my architecture diagrams.",
    initials: "MC",
    color: "bg-emerald-500",
  },
  {
    name: "Priya Sharma",
    role: "Engineering Manager",
    company: "Netflix",
    quote:
      "Onboarding docs with embedded live diagrams? That's the killer feature. New hires get up to speed in days, not weeks.",
    initials: "PS",
    color: "bg-amber-500",
  },
  {
    name: "James Wilson",
    role: "CTO",
    company: "Ripple",
    quote:
      "We tried Miro, we tried Notion, we tried Whimsical. DrawDoc replaces all three. And it's free.",
    initials: "JW",
    color: "bg-purple-500",
  },
  {
    name: "Elena Voss",
    role: "Lead Developer",
    company: "GitLab",
    quote:
      "The AI panel understands context. I asked it to 'add a retry queue with dead letter' and it edited both the doc and the diagram.",
    initials: "EV",
    color: "bg-cyan-500",
  },
  {
    name: "Rahul Nair",
    role: "Solutions Architect",
    company: "AWS",
    quote:
      "I built a full reference architecture in DrawDoc during a two-hour flight. No internet, no problem — it synced when I landed.",
    initials: "RN",
    color: "bg-rose-500",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Loved by engineers</h2>
        <p className="mt-4 text-surface-400 text-lg">From startups to FAANG teams.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="p-6 rounded-2xl border border-surface-800 bg-surface-900/50 hover:bg-surface-900 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}
              >
                {t.initials}
              </div>
              <div>
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-surface-500 text-xs">
                  {t.role}, {t.company}
                </div>
              </div>
            </div>
            <p className="text-surface-300 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
          </div>
        ))}
      </div>
    </section>
  );
}
