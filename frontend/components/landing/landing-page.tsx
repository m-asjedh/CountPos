'use client';

import { LandingHeroSection } from './hero-section';
import { LandingFeatureSection } from './feature-section';
import { LandingAboutSection } from './about-section';
import { LandingFaqSection } from './faq-section';
import { LandingFooterSection } from './footer-section';

const team = [
  {
    name: 'Product & Engineering',
    role: 'Platform team',
    bio: 'Building reliable POS tools for modern retail.',
  },
  {
    name: 'Customer success',
    role: 'Onboarding',
    bio: 'Helping stores go live with inventory and staff setup.',
  },
  {
    name: 'Retail advisors',
    role: 'Domain experts',
    bio: 'Grocery, pharmacy, hardware — workflows shaped by real shops.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingHeroSection />
      <LandingFeatureSection />
      <LandingAboutSection />
      <LandingFaqSection />
      <LandingFooterSection />
    </div>
  );
}
