'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { TimelineAnimation } from '@/components/ui/timeline-animation';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  img: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'What is CountPos?',
    answer:
      'CountPos is a cloud-based multi-company POS platform for grocery stores, pharmacies, hardware shops, supermarkets, and general retail.',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    question: 'Do you support credit sales?',
    answer:
      'Yes. Record credit invoices, track customer balances, accept partial payments, and settle outstanding credit later. Cash sales are fully supported too.',
    img: 'https://images.unsplash.com/photo-1571172964276-91b47fae0956?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    question: 'Can staff add products without admin access?',
    answer:
      'Staff can create products that stay pending until an admin approves them. Once approved, items appear in POS billing immediately.',
    img: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '4',
    question: 'Is my store data isolated from others?',
    answer:
      'Every company has a strict multi-tenant workspace. Users only see their own products, invoices, customers, and reports.',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '5',
    question: 'Can I import products from Excel?',
    answer:
      'Import CSV or XLSX files with SKU, quantity, and prices — including encoded letter prices using your store code-word settings.',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '6',
    question: 'How do I get started?',
    answer:
      'Click Sign up to register your company, create your admin account, add staff, import or add products, and start selling from the billing screen.',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
  },
];

/** UI Layouts faq-interactive-preview — CountPos landing only */
export function LandingFaqSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<FAQItem>(FAQ_DATA[0]);

  return (
    <section
      id="faq"
      className="relative flex w-full scroll-mt-20 flex-col items-center justify-center bg-white py-24"
      ref={timelineRef}
    >
      <TimelineAnimation
        timelineRef={timelineRef}
        animationNum={0}
        as="h2"
        className="mb-4 text-center text-3xl font-bold text-slate-900 sm:text-4xl"
      >
        Frequently asked questions
      </TimelineAnimation>
      <p className="mb-10 text-center text-slate-600">Quick answers before you create your store.</p>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-2">
        <div className="space-y-4">
          {FAQ_DATA.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              onMouseEnter={() => setActiveItem(item)}
              onClick={() => setActiveItem(item)}
              className={cn(
                'group flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-6 text-left transition-all duration-300',
                activeItem.id === item.id
                  ? 'scale-[1.02] bg-white text-slate-900 shadow-2xl ring-2 ring-indigo-100'
                  : 'bg-white text-slate-600 hover:bg-indigo-50/50',
              )}
            >
              <span className="text-lg font-semibold">{item.question}</span>
              <ArrowRight
                className={cn(
                  'text-indigo-600 transition-transform',
                  activeItem.id === item.id
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                )}
              />
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex min-h-[500px] flex-col justify-center rounded-xl bg-indigo-50/50 p-6 shadow-sm ring-1 ring-indigo-100"
          >
            <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-700">
              CountPos
            </span>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
              {activeItem.question}
            </h3>
            <p className="mt-4 leading-relaxed text-slate-600">{activeItem.answer}</p>
            <img
              src={activeItem.img}
              alt=""
              className="mt-4 aspect-video rounded-lg object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/register"
          className="inline-flex rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Create your store
        </Link>
      </div>
    </section>
  );
}
