export const SUBSCRIPTION_TIERS = {
  pro: {
    name: "Pro",
    price_id: "price_1SDvdfS1vTaYJ0NRSatq98VH",
    product_id: "prod_TAG99xsDB0jzm2",
    price: "$19/month",
    features: [
      "All Premium Templates",
      "Advanced Export Options",
      "Priority Support",
      "Custom Branding"
    ]
  },
  elite: {
    name: "Elite",
    price_id: "price_1SDvdxS1vTaYJ0NRstl1dw1R",
    product_id: "prod_TAGASnWIY7uFKo",
    price: "$49/month",
    features: [
      "Everything in Pro",
      "Web Page Publishing",
      "Video Presentations",
      "Video Output Generation",
      "White Label Options"
    ]
  }
} as const;

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export function canAccessTemplate(userTier: SubscriptionTier, templateTier: SubscriptionTier): boolean {
  const tierOrder = { free: 0, pro: 1, elite: 2 };
  return tierOrder[userTier] >= tierOrder[templateTier];
}
