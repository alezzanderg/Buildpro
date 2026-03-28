import { useAuth } from "@workspace/replit-auth-web";
import {
  FileText, ClipboardList, ScrollText, Receipt,
  Sparkles, Shield, Download, ArrowRight, CheckCircle2,
  Building2, Zap, Users,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    icon: ClipboardList,
    label: "Proposal",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    desc: "Write a compelling project proposal with AI-enhanced text to win the job.",
  },
  {
    icon: FileText,
    label: "Estimate",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    desc: "Build a detailed line-item estimate with materials, labor, and markup.",
  },
  {
    icon: ScrollText,
    label: "Contract",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    desc: "Generate a professional contract with scope, payment terms, and signatures.",
  },
  {
    icon: Receipt,
    label: "Invoice",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
    desc: "Send polished invoices and track payment status from the same platform.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Writing",
    desc: "Enhance any section of your proposal with AI-generated professional text — streamed live in real time.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Download,
    title: "6 PDF Templates",
    desc: "Export any document as a polished PDF with your company branding. Choose from 6 professional templates.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Shield,
    title: "All Data Persisted",
    desc: "Every setting, client, estimate, and proposal is stored securely in the cloud — never lost between sessions.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Building2,
    title: "Company Branding",
    desc: "Set up your company name, address, license number, and logo once — it appears on every document.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Users,
    title: "Client & Supplier CRM",
    desc: "Keep all your clients, suppliers, and material pricing in one organized place.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Zap,
    title: "Fast & Focused",
    desc: "Built for contractors, not accountants. Everything you need, nothing you don't.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
];

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">ProBuilder</span>
          </div>
          <button
            onClick={login}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Log in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            AI-enhanced proposals · 6 PDF templates
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight">
            Win more jobs with{" "}
            <span className="text-primary">professional</span>{" "}
            documents
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ProBuilder handles your entire document workflow — proposals, estimates,
            contracts, and invoices — so you can focus on building, not paperwork.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={login}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
            >
              Get started free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={login}
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-border text-foreground text-base font-medium hover:bg-secondary/50 transition-colors"
            >
              Log in to your account
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 text-sm text-muted-foreground">
            {["Free to start", "No credit card required", "Cloud-synced"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW STEPS ─────────────────────────────────── */}
      <section className="py-20 px-6 bg-secondary/20 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">The full workflow</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              From first contact to final payment
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every document type you need, connected in a single platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.label} className="relative">
                {/* connector arrow on desktop */}
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 z-10 text-border">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
                <div className={`h-full rounded-2xl border p-6 space-y-4 ${step.bg}`}>
                  <div className={`w-10 h-10 rounded-xl ${step.bg} border flex items-center justify-center`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {i + 1}</span>
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground">{step.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Built for professionals</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Everything a contractor needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/30 transition-colors group"
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground text-base">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-primary/5 border-t border-primary/10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            Ready to look more professional?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join contractors who use ProBuilder to win more bids and get paid faster.
          </p>
          <button
            onClick={login}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-foreground">ProBuilder</span>
          </div>
          <p>© {new Date().getFullYear()} ProBuilder. Built for contractors.</p>
        </div>
      </footer>
    </div>
  );
}
