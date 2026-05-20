import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Package, Receipt, MonitorSmartphone, Users, ArrowRight, Zap } from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Inventory that updates instantly',
    description: 'Stock levels adjust automatically with every sale. Never oversell or run out unexpectedly.',
  },
  {
    icon: Receipt,
    title: 'Receipts and reports in one click',
    description: 'Print thermal receipts and export sales reports anytime. No spreadsheets needed.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Works on desktop and mobile',
    description: 'Use it on a tablet at your counter or your phone on the go. Fully responsive and offline-capable.',
  },
  {
    icon: Users,
    title: 'Team access with roles',
    description: 'Add staff with owner or salesman roles. Control who can manage inventory vs. just ring sales.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            <span>Built for Kenyan businesses</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight mb-4">
            Sell smarter with <span className="text-primary">KwaPOS</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            A fast, offline-ready point of sale designed for small shops and stalls. Cash and M-Pesa accepted.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pos">
              <Button size="lg" className="h-14 px-8 text-lg font-display gap-2">
                Open POS <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/install">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-display">
                Install App
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-muted/40">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-center mb-12">
            Everything you need to run your shop
          </h2>
          <div className="grid gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
        <p>KwaPOS &middot; Made for Kenyan duka owners</p>
      </footer>
    </div>
  );
}
