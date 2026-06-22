'use client';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, BarChart3, Lock, Globe, Code2, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Sub-100ms response times with Redis caching and optimized queries' },
    { icon: Shield, title: 'Fraud Detection', desc: 'Real-time ML-powered fraud scoring with automatic blocking' },
    { icon: BarChart3, title: 'Analytics', desc: 'Live revenue dashboards, cohort analysis, and trend forecasting' },
    { icon: Lock, title: 'Bank-grade Security', desc: 'JWT auth, rate limiting, and full audit trail on every action' },
    { icon: Globe, title: 'Multi-currency', desc: 'Support for USD, EUR, GBP, INR and 3 more currencies' },
    { icon: Code2, title: 'Developer First', desc: 'RESTful API with OpenAPI docs, idempotency keys, and webhooks' },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '<50ms', label: 'Avg Latency' },
    { value: '7', label: 'Currencies' },
    { value: '256-bit', label: 'Encryption' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-dark-800/60 backdrop-blur-xl bg-dark-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-bold text-sm">P</div>
            <span className="font-bold text-lg tracking-tight">PayFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-dark-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">Sign In</Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-radial from-brand-red/8 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-red/5 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red-light text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-red-light animate-pulse" />
            Now with real-time fraud detection
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
            <span className="text-gradient">The Payment</span>
            <br />
            <span className="text-gradient-red">Infrastructure</span>
            <br />
            <span className="text-gradient">You Deserve.</span>
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            PayFlow is a production-grade payment gateway simulator — complete with fraud detection,
            real-time analytics, webhooks, and enterprise-level security built in from day one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register"
              className="btn-primary flex items-center gap-2 text-base px-8 py-3.5 rounded-xl glow-red">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features"
              className="btn-ghost flex items-center gap-2 text-base px-8 py-3.5 rounded-xl">
              View Features
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-dark-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-gradient-red mb-1">{s.value}</div>
              <div className="text-sm text-dark-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-gradient">
              Everything You Need
            </h2>
            <p className="text-dark-400 text-lg max-w-xl mx-auto">
              A complete payments platform with zero compromises on security, performance, or developer experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="metric-card group">
                <div className="w-10 h-10 rounded-lg bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mb-4 group-hover:bg-brand-red/20 transition-colors">
                  <Icon className="w-5 h-5 text-brand-red-light" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Preview */}
      <section className="py-24 px-6 bg-dark-900/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-mono mb-6">
              POST /api/v1/payments
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 text-gradient">
              Integrate in Minutes
            </h2>
            <p className="text-dark-400 mb-8 leading-relaxed">
              Clean RESTful API with full OpenAPI documentation, idempotency keys,
              and real-time webhook delivery. Built like Stripe, designed for developers.
            </p>
            <ul className="space-y-3">
              {['Idempotency-safe endpoints', 'Webhook event streaming', 'Comprehensive error codes', 'Real-time status via WebSocket'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-dark-300">
                  <CheckCircle className="w-4 h-4 text-brand-red-light flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-6 font-mono text-sm overflow-x-auto">
            <div className="text-dark-500 mb-2">// Create a payment</div>
            <pre className="text-dark-200 leading-relaxed whitespace-pre-wrap">{`const response = await fetch(
  '/api/v1/payments',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 99.99,
      currency: 'USD',
      paymentMethod: 'CARD',
      cardLastFour: '4242',
      idempotencyKey: uuid(),
    }),
  }
);

// {
//   "success": true,
//   "data": {
//     "paymentReference": "PAY20240101...",
//     "status": "PENDING",
//     "amount": 99.99
//   }
// }`}</pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-black tracking-tighter mb-6 text-gradient">
            Ready to Ship?
          </h2>
          <p className="text-dark-400 text-lg mb-10">
            Join thousands of developers building the next generation of fintech products.
          </p>
          <Link href="/auth/register"
            className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4 rounded-xl glow-red">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-red flex items-center justify-center text-xs font-bold">P</div>
            <span className="font-bold">PayFlow</span>
          </div>
          <p className="text-dark-500 text-sm">© 2024 PayFlow. Built with Spring Boot & Next.js.</p>
          <div className="flex gap-6 text-sm text-dark-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
