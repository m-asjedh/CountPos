'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { CreditCard, LogIn, ShoppingBag, UserPlus } from 'lucide-react';
import { TimelineAnimation } from '@/components/ui/timeline-animation';
import { useMediaQuery } from '@/components/use-media-query';
import MotionDrawer from '@/components/ui/motion-drawer';
import { DashboardPreview } from './dashboard-preview';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
  { href: '#team', label: 'Team' },
  { href: '#faq', label: 'FAQ' },
];

function CountPosLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-lg bg-indigo-500 text-white ${className}`}>
      <ShoppingBag className="h-4 w-4" />
    </span>
  );
}

/** UI Layouts hero-ai-ecommerce — adapted for CountPos landing only. */
export function LandingHeroSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      ref={timelineRef}
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-white text-neutral-900"
    >
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1764138370667-d15f89ee1c45?q=80&w=1760&auto=format&fit=crop')] bg-cover bg-center opacity-40" />

      {isMobile && (
        <div className="relative z-10 flex w-full items-center justify-between gap-4 px-6 pt-4">
          <MotionDrawer
            direction="left"
            width={280}
            backgroundColor="#ffffff"
            clsBtnClassName="bg-neutral-800 border-r border-neutral-900 text-white"
            contentClassName="bg-white border-r border-neutral-200 text-black"
            btnClassName="relative left-0 top-0 w-fit rounded-full border border-neutral-200 bg-white p-2 text-black shadow-xs"
          >
            <nav className="space-y-2">
              <Link href="/landingpage" className="mb-4 flex items-center gap-2 font-bold text-black">
                <CountPosLogo />
                CountPos
              </Link>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-sm p-2 hover:bg-neutral-100"
                >
                  {link.label}
                </a>
              ))}
              <Link href="/login" className="block rounded-sm p-2 font-medium text-indigo-600">
                Log in
              </Link>
              <Link href="/register" className="block rounded-sm p-2 font-medium text-indigo-600">
                Sign up
              </Link>
            </nav>
          </MotionDrawer>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xs"
          >
            <LogIn size={16} /> Log in
          </Link>
        </div>
      )}

      {!isMobile && (
        <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
          <TimelineAnimation
            as="div"
            animationNum={1}
            timelineRef={timelineRef}
            className="flex items-center gap-8 rounded-full border border-neutral-200 bg-white px-6 py-3 shadow-xs"
          >
            <Link href="/landingpage" className="flex items-center gap-2 font-extrabold text-indigo-600">
              <CountPosLogo />
              <span className="text-lg text-neutral-900">CountPos</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-neutral-800 md:flex">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-indigo-500">
                  {link.label}
                </a>
              ))}
            </nav>
          </TimelineAnimation>

          <div className="flex items-center gap-3">
            <TimelineAnimation
              as="div"
              animationNum={2}
              timelineRef={timelineRef}
              className="flex items-center gap-2"
            >
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium shadow-xs hover:bg-neutral-50"
              >
                <LogIn size={16} /> Log in
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-indigo-700"
              >
                <UserPlus size={16} /> Sign up
              </Link>
            </TimelineAnimation>
          </div>
        </header>
      )}

      <div className="relative z-10 px-4 pb-12 pt-10 text-center sm:pt-16">
        <TimelineAnimation
          as="h1"
          animationNum={3}
          timelineRef={timelineRef}
          className="mb-8 text-5xl font-medium tracking-tight text-neutral-800 sm:text-6xl md:text-7xl"
        >
          Run your store smarter with{' '}
          <br className="hidden sm:inline-block" />
          <TimelineAnimation
            as="span"
            animationNum={4}
            timelineRef={timelineRef}
            className="relative mt-2 inline-block rounded-md border-2 border-indigo-500 bg-indigo-100 px-4 py-1 text-indigo-600"
          >
            CountPos
            <div className="absolute -left-1.5 -top-1.5 h-3 w-3 border-2 border-indigo-500 bg-white" />
            <div className="absolute -right-1.5 -top-1.5 h-3 w-3 border-2 border-indigo-500 bg-white" />
            <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-2 border-indigo-500 bg-white" />
            <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-2 border-indigo-500 bg-white" />
          </TimelineAnimation>
        </TimelineAnimation>

        <TimelineAnimation
          as="p"
          animationNum={5}
          timelineRef={timelineRef}
          className="mx-auto mb-8 max-w-2xl text-lg font-normal leading-relaxed text-neutral-600 md:text-xl"
        >
          Cloud POS for grocery, pharmacy, hardware, and retail — fast billing, inventory,
          staff approvals, credit customers, and live dashboards in one platform.
        </TimelineAnimation>

        <div className="flex flex-col items-center gap-6">
          <TimelineAnimation
            as="div"
            animationNum={6}
            timelineRef={timelineRef}
            className="h-20 rounded-full bg-linear-to-t from-indigo-800 to-indigo-100 p-1.5"
          >
            <Link
              href="/register"
              className="inline-block rounded-full bg-linear-to-l from-indigo-500 to-indigo-600 px-10 py-5 text-lg font-semibold text-white shadow-[inset_4px_4px_5px_0px_rgba(168,170,241,0.5),inset_-1px_-2px_5px_0px_rgba(74,78,197,0.5)]"
            >
              Create your store
            </Link>
          </TimelineAnimation>
          <TimelineAnimation
            as="p"
            animationNum={6}
            timelineRef={timelineRef}
            className="flex items-center gap-2 text-sm font-medium text-neutral-600"
          >
            <CreditCard size={16} /> Cash & credit billing · No payment gateway required
          </TimelineAnimation>
        </div>
      </div>

      <div className="relative z-10 mt-6 w-full max-w-7xl px-4 pb-16">
        <TimelineAnimation
          animationNum={7}
          timelineRef={timelineRef}
          className="rounded-2xl bg-white/60 p-4 backdrop-blur-lg"
        >
          <TimelineAnimation animationNum={8} timelineRef={timelineRef}>
            <DashboardPreview />
          </TimelineAnimation>
        </TimelineAnimation>
      </div>
    </section>
  );
}
