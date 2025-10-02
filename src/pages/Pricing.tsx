import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";

export default function Pricing() {
  const { tier, trialActive, checkSubscription } = useSubscription();

  const handleCheckout = async (priceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to subscribe");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        
        // Check subscription after a delay
        setTimeout(() => {
          checkSubscription();
        }, 2000);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open customer portal");
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with basic templates",
      features: [
        "Basic Templates (UFC, Team, Solo, Military, Custom)",
        "Standard Brand Generation",
        "Basic Export Options",
        "Community Support"
      ],
      cta: "Current Plan",
      tier: "free",
      highlight: false
    },
    {
      name: SUBSCRIPTION_TIERS.pro.name,
      price: SUBSCRIPTION_TIERS.pro.price,
      description: "Unlock premium templates and features",
      features: SUBSCRIPTION_TIERS.pro.features,
      cta: tier === "pro" ? "Current Plan" : "Start Free Trial",
      tier: "pro",
      priceId: SUBSCRIPTION_TIERS.pro.price_id,
      highlight: true,
      badge: "Popular"
    },
    {
      name: SUBSCRIPTION_TIERS.elite.name,
      price: SUBSCRIPTION_TIERS.elite.price,
      description: "Complete professional branding suite",
      features: SUBSCRIPTION_TIERS.elite.features,
      cta: tier === "elite" ? "Current Plan" : "Start Free Trial",
      tier: "elite",
      priceId: SUBSCRIPTION_TIERS.elite.price_id,
      highlight: false,
      badge: "Best Value"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">Pricing</h1>
            <Button asChild variant="outline">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start with a 7-day free trial on any paid plan. No credit card required upfront.
          </p>
          {trialActive && (
            <Badge variant="secondary" className="mt-4">
              🎉 Free Trial Active
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.highlight
                  ? "border-primary shadow-glow bg-primary/5"
                  : "border-border bg-surface/50"
              }`}
            >
              {plan.badge && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  variant={plan.highlight ? "default" : "secondary"}
                >
                  {plan.badge}
                </Badge>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading text-2xl font-bold">{plan.name}</h3>
                  {plan.tier === "elite" && <Crown className="w-5 h-5 text-amber-400" />}
                  {plan.tier === "pro" && <Zap className="w-5 h-5 text-blue-400" />}
                </div>
                <div className="text-3xl font-bold mb-2">
                  {plan.price}
                  {plan.tier !== "free" && <span className="text-base font-normal text-muted-foreground">/month</span>}
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier === plan.tier ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={tier === "free"}
                >
                  {tier === "free" ? "Current Plan" : "Manage Subscription"}
                </Button>
              ) : (
                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                  onClick={() => plan.priceId && handleCheckout(plan.priceId)}
                  disabled={!plan.priceId}
                >
                  {plan.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-muted-foreground text-sm">
          <p>All paid plans include a 7-day free trial</p>
          <p className="mt-2">Cancel anytime • Secure payments via Stripe</p>
        </div>
      </div>
    </div>
  );
}
