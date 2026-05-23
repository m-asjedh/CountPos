'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUp, ShoppingBag } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
  { href: '#team', label: 'Team' },
  { href: '#faq', label: 'FAQ' },
];

/** UI Layouts footer-hero — CountPos landing only */
export function LandingFooterSection() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-neutral-100 pt-32 font-sans">
      <div className="mx-auto w-[90%] max-w-6xl px-6">
        <div className="relative z-10 -mb-24">
          <div className="group relative h-80 overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 to-indigo-800 shadow-2xl md:h-96">
            <img
              src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1200&auto=format&fit=crop"
              alt=""
              className="h-full w-full object-cover opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16">
              <h2 className="mb-8 max-w-2xl text-4xl font-bold text-white md:text-5xl">
                Ready to run your store on CountPos?
              </h2>
              <Link
                href="/register"
                className="group flex w-fit items-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                Get started free
                <span className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <ArrowRight className="size-5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6">
        <div className="rounded-t-3xl bg-slate-900 px-6 pb-16 pt-40 text-white md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-start gap-12 pb-12 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
                    <ShoppingBag className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold">CountPos</p>
                    <p className="text-sm text-gray-400">Cloud POS for modern retail</p>
                  </div>
                </div>
                <p className="max-w-md text-gray-400">
                  Multi-tenant point of sale for grocery, pharmacy, hardware, supermarkets, and mini
                  marts.
                </p>
              </div>

              <div className="space-y-4 lg:text-right">
                <h3 className="text-lg font-medium text-gray-300">Get started today</h3>
                <p className="text-sm text-gray-500 lg:ml-auto lg:max-w-md">
                  Register your company, add staff, and start billing in minutes.
                </p>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link
                    href="/register"
                    className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold hover:bg-indigo-500"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-gray-600 px-6 py-2.5 text-sm font-semibold hover:border-gray-400"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-6 border-t border-gray-800 py-8 text-sm font-medium text-gray-400 md:grid-cols-4 lg:grid-cols-6">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-white">
                  {link.label}
                </a>
              ))}
              <Link href="/login" className="hover:text-white">
                Log in
              </Link>
              <Link href="/register" className="hover:text-white">
                Sign up
              </Link>
            </nav>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-gray-800 py-8 md:flex-row">
              <span className="text-sm text-gray-500">
                © {new Date().getFullYear()} CountPos. All rights reserved.
              </span>
              <button
                type="button"
                onClick={scrollTop}
                className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Back to top
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-slate-900">
                  <ArrowUp className="size-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
