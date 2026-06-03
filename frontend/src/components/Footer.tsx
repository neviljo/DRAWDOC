export default function Footer() {
  return (
    <footer className="border-t border-surface-800 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
            D
          </div>
          <span className="font-semibold text-sm">DrawDoc</span>
          <span className="text-surface-600 text-xs">— diagrams and docs, together live.</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-surface-400">
          <a href="#" className="hover:text-surface-200 transition-colors">Features</a>
          <a href="#" className="hover:text-surface-200 transition-colors">Docs</a>
          <a href="#" className="hover:text-surface-200 transition-colors">GitHub</a>
          <a href="#" className="hover:text-surface-200 transition-colors">Status</a>
        </div>

        <div className="text-xs text-surface-600">
          &copy; {new Date().getFullYear()} DrawDoc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
