'use client';

import Link from 'next/link';
import {
  BarChart3,
  CreditCard,
  Package,
  ShoppingBag,
  Shield,
  Users,
} from 'lucide-react';

/** UI Layouts feature-bento — CountPos landing only (between hero & about) */
export function LandingFeatureSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-slate-50 py-16 font-sans md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center md:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Everything your shop needs
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Billing, inventory, staff, and reports — one cloud platform for retail.
          </p>
        </div>

        <div className="grid auto-rows-[280px] grid-cols-1 gap-4 md:grid-cols-3">
          {/* Hero bento — large */}
          <div className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-linear-to-br from-indigo-400 via-indigo-600 to-indigo-700 p-10 text-white md:col-span-2 md:row-span-2">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200')] bg-cover bg-center opacity-25 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-linear-to-t from-indigo-950/70 to-transparent" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="size-2 animate-pulse rounded-full bg-indigo-200" />
                Live POS
              </div>
              <h3 className="text-4xl font-bold tracking-tight md:text-5xl">
                Fast billing
                <br />
                for real stores
              </h3>
              <p className="max-w-md text-lg text-white/90">
                Search products, scan barcodes, hold invoices, and checkout with cash or customer
                credit — built for busy counters.
              </p>
            </div>
          </div>

          {/* Stat — products */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br from-indigo-400 to-indigo-700 p-8 transition-all">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white backdrop-blur-sm">
                <Package className="h-6 w-6" />
              </div>
              <h4 className="mb-2 text-4xl font-black text-white">∞</h4>
              <p className="font-medium text-indigo-100">Products per store</p>
            </div>
          </div>

          {/* Feature — approvals */}
          <div className="group flex flex-col justify-between rounded-3xl border border-indigo-100 bg-white p-8 transition-all">
            <div className="flex size-12 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-indigo-400 text-white">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-bold text-slate-900">Staff approvals</h4>
              <p className="text-slate-600">
                Staff add products; admins approve before they appear in POS.
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/register"
            className="group flex cursor-pointer flex-col justify-between rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 p-8 text-white transition-all hover:from-indigo-950 hover:to-indigo-900"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Get started
              </span>
              <div className="flex size-10 items-center justify-center rounded-full bg-white/20 text-xl transition-all group-hover:rotate-45 group-hover:bg-white/30">
                ↗
              </div>
            </div>
            <h4 className="text-2xl font-bold leading-tight">
              Create your
              <br />
              store today
            </h4>
          </Link>

          {/* Stat — tenants */}
          <div className="group relative flex flex-col justify-center gap-3 overflow-hidden rounded-3xl bg-slate-950 p-8 text-white">
            <span className="absolute right-5 top-5 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-indigo-500" />
            </span>
            <div className="relative z-10">
              <span className="bg-linear-to-r from-indigo-200 to-indigo-400 bg-clip-text text-5xl font-black text-transparent">
                Multi
              </span>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
                Tenant isolated
              </p>
            </div>
          </div>

          {/* Stat — payments */}
          <div className="group relative flex flex-col justify-center gap-3 overflow-hidden rounded-3xl bg-linear-to-br from-indigo-500 to-indigo-600 p-8 text-white transition-all hover:shadow-2xl">
            <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-indigo-200" />
                <ShoppingBag className="h-8 w-8 text-indigo-200" />
              </div>
              <span className="text-5xl font-black">2</span>
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-indigo-100">
                Cash & credit
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
            <BarChart3 className="h-4 w-4" />
            Dashboards, reports & CSV export
            <Shield className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
