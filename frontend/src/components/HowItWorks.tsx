const steps = [
  {
    step: "01",
    title: "Type a prompt",
    description: "Open the AI panel and describe what you want — a system architecture, a sequence diagram, anything.",
  },
  {
    step: "02",
    title: "AI plans and generates",
    description: "Your prompt goes through LangGraph: routing, planning, and element generation using Groq LLMs.",
  },
  {
    step: "03",
    title: "Edit like any drawing",
    description: "Elements appear on the canvas in real time. Move, resize, recolor — it's yours to refine.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
        <p className="mt-4 text-surface-400 text-lg">Three steps from idea to diagram.</p>
      </div>

      <div className="space-y-12">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-start gap-6 group">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-mono text-sm font-bold">
              {s.step}
            </div>
            <div className="pt-2">
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-surface-400 leading-relaxed">{s.description}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute left-6 ml-0 w-px h-12 bg-surface-800 -bottom-12" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
