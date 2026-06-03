import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient, setAuthToken } from "../lib/api-client";
import { useAuthStore } from "../lib/auth-store";

function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 8, /[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  return (
    <div className="flex gap-1 mt-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? colors[score] : "bg-surface-800"}`} />
      ))}
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!agree) { setError("You must agree to the Terms of Service"); return; }
    try {
      const res = await apiClient.post<{ user: any; access_token: string }>("/auth/register", {
        display_name: name,
        email,
        password,
      });
      setAuthToken(res.access_token);
      setUser(res.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-accent/20 via-surface-900 to-surface-950 items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
            D
          </div>
          <h2 className="text-3xl font-bold mb-3">Join DrawDoc</h2>
          <p className="text-surface-400">Create diagrams and docs together in real time.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6">Create your account</h1>

          <div className="flex flex-col gap-3 mb-6">
            <button className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-surface-700 hover:bg-surface-800 transition-colors text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <button className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-surface-700 hover:bg-surface-800 transition-colors text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-800" />
            <span className="text-xs text-surface-500">or</span>
            <div className="flex-1 h-px bg-surface-800" />
          </div>

          {error && <div className="text-red-400 text-sm mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700 focus:border-accent outline-none transition-colors text-sm"
                placeholder="Jane Doe"
                minLength={2}
                maxLength={50}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700 focus:border-accent outline-none transition-colors text-sm"
                placeholder="jane@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700 focus:border-accent outline-none transition-colors text-sm"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              {password && <PasswordStrength password={password} />}
            </div>
            <label className="flex items-start gap-3 text-sm text-surface-400">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
              I agree to the Terms of Service and Privacy Policy
            </label>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-soft transition-colors text-sm">
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
