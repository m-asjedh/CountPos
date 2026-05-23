'use client';

import Link from 'next/link';
import { BarChart3, Package, Shield, ShoppingBag, Store, Users } from 'lucide-react';
import { motion } from 'motion/react';

const highlights = [
  {
    title: 'Multi-tenant workspaces',
    description:
      'Each business gets an isolated store — products, invoices, and customers never mix between companies.',
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: 'Inventory that stays accurate',
    description:
      'Stock updates automatically on every sale. Low-stock alerts and approval workflows keep shelves under control.',
    icon: <Package className="h-6 w-6" />,
  },
  {
    title: 'Cash & credit built in',
    description:
      'Process counter sales instantly or bill on customer credit with balance tracking and partial payments.',
    icon: <Shield className="h-6 w-6" />,
  },
];

const storeTypes = [
  'Grocery',
  'Pharmacy',
  'Hardware',
  'Supermarket',
  'Mini Mart',
  'Retail',
];

/** UI Layouts about-sass — CountPos landing only (white & blue) */
export function LandingAboutSection() {
  return (
    <section id="about" className="scroll-mt-20 overflow-hidden bg-zinc-50 px-6 py-24 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-24">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white p-10 shadow-sm md:p-16">
          <img
            src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1200&auto=format&fit=crop"
            alt=""
            className="pointer-events-none absolute right-0 top-0 hidden w-2/3 opacity-[0.06] lg:block"
          />

          <div className="relative z-10 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-8 flex items-center gap-3"
            >
              <div className="size-2.5 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">
                About CountPos
              </span>
            </motion.div>

            <h2 className="mb-8 text-balance text-5xl font-bold leading-[0.95] tracking-tighter md:text-7xl">
              Built for retail, <br />
              <span className="text-indigo-600">powered in the cloud.</span>
            </h2>

            <p className="mb-12 text-pretty text-xl leading-relaxed text-zinc-500">
              CountPos is a multi-company POS platform for shops that need fast billing, real
              inventory, and staff workflows — without spreadsheets or disconnected tools. Admins run
              the business; cashiers run the counter.
            </p>

            <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-6">
              {storeTypes.map((item) => (
                <span
                  key={item}
                  className="cursor-default text-xs font-semibold text-zinc-500 transition-colors hover:text-indigo-600"
                >
                  {item}
                </span>
              ))}
            </div>

            <Link
              href="/register"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <ShoppingBag className="h-4 w-4" />
              Start your store
            </Link>
          </div>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <h3 className="text-balance text-4xl font-bold tracking-tight">
              One platform from first product to daily sales.
            </h3>
            <p className="text-pretty leading-relaxed text-zinc-500">
              Import catalogs from Excel, approve staff-added products, sell with barcode search,
              and watch profit and cash vs credit on a live dashboard — all scoped to your company.
            </p>
            <div className="flex gap-12 pt-4">
              <div className="space-y-1">
                <div className="text-3xl font-black text-indigo-600">100%</div>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Tenant isolated
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-indigo-600">2</div>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Payment modes
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-3xl font-black text-indigo-600">
                  <Store className="h-7 w-7" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Per store
                </div>
              </div>
            </div>
          </div>

          <div className="group relative flex aspect-video flex-col justify-end overflow-hidden rounded-3xl bg-indigo-950 p-8">
            <div className="relative z-10 space-y-4">
              <div className="h-1 w-full overflow-hidden rounded-full bg-indigo-800">
                <motion.div
                  initial={{ x: '-100%' }}
                  whileInView={{ x: '0%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="size-full bg-indigo-400"
                />
              </div>
              <div className="mb-12 flex justify-between font-mono text-xs uppercase text-indigo-300/80">
                <span>Today&apos;s sales</span>
                <span className="animate-pulse font-bold text-indigo-300">Live</span>
              </div>
              <div className="grid h-40 grid-cols-6 items-end gap-2">
                {[125, 70, 120, 90, 99, 80].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="rounded-t-sm bg-indigo-500 transition-colors group-hover:bg-indigo-400"
                  />
                ))}
              </div>
              <p className="flex items-center gap-2 text-sm text-indigo-200/90">
                <BarChart3 className="h-4 w-4" />
                Sales trend preview
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {highlights.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-3xl border border-indigo-50 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold tracking-tight">{feature.title}</h3>
              <p className="text-pretty text-sm leading-relaxed text-zinc-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
