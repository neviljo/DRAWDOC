import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import DemoEditor from "../components/DemoEditor";
import Testimonials from "../components/Testimonials";
import PricingSection from "../components/PricingSection";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />

      <section id="demo" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Try it now</h2>
          <p className="mt-4 text-surface-400 text-lg">
            No sign-up required. Type, draw, and see real-time collaboration in action.
          </p>
        </div>
        <DemoEditor />
      </section>

      <Testimonials />
      <PricingSection />
      <Footer />
    </main>
  );
}
