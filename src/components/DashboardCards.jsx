import React from 'react';
import { PackagePlus, Truck, Boxes, Wallet } from 'lucide-react';
import { formatPKR, formatPetti } from '../utils/format';

export default function DashboardCards({ metrics }) {
  const isOutOfStock = metrics.remainingStock <= 0;
  const isLowStock = metrics.remainingStock > 0 && metrics.remainingStock <= 3;

  const cards = [
    {
      id: 'received',
      label: 'Total Stock Received',
      value: formatPetti(metrics.totalReceived),
      subtext:
        metrics.avgPurchasePrice > 0
          ? `Avg ${formatPKR(metrics.avgPurchasePrice)} / Petti`
          : 'No stock added yet',
      icon: PackagePlus,
      iconBg: 'bg-slate-100 text-slate-700',
      accentBorder: 'border-slate-200/80',
      valueColor: 'text-slate-900',
    },
    {
      id: 'supplied',
      label: 'Total Stock Supplied',
      value: formatPetti(metrics.totalSupplied),
      subtext:
        metrics.totalReceived > 0
          ? `${Math.round((metrics.totalSupplied / metrics.totalReceived) * 100)}% of total stock`
          : 'No supplies yet',
      icon: Truck,
      iconBg: 'bg-sky-50 text-sky-700',
      accentBorder: 'border-slate-200/80',
      valueColor: 'text-slate-900',
    },
    {
      id: 'remaining',
      label: 'Remaining Stock',
      value: formatPetti(metrics.remainingStock),
      subtext: isOutOfStock
        ? 'Out of stock — add new stock'
        : isLowStock
          ? 'Low stock alert'
          : 'Available for supply',
      icon: Boxes,
      iconBg: isOutOfStock
        ? 'bg-rose-100 text-rose-700'
        : isLowStock
          ? 'bg-amber-100 text-amber-700'
          : 'bg-emerald-100 text-emerald-700',
      accentBorder: isOutOfStock
        ? 'border-rose-200 bg-rose-50/40'
        : isLowStock
          ? 'border-amber-200 bg-amber-50/40'
          : 'border-emerald-200 bg-emerald-50/40',
      valueColor: isOutOfStock
        ? 'text-rose-700'
        : isLowStock
          ? 'text-amber-700'
          : 'text-emerald-700',
      highlight: true,
    },
    {
      id: 'sales',
      label: 'Total Sales Amount',
      value: formatPKR(metrics.totalSales),
      subtext:
        metrics.avgSellingPrice > 0
          ? `Avg ${formatPKR(metrics.avgSellingPrice)} / Petti`
          : 'PKR revenue',
      icon: Wallet,
      iconBg: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25',
      accentBorder: 'border-slate-200/80',
      valueColor: 'text-slate-900',
    },
  ];

  return (
    <section id="dashboard" aria-label="Dashboard Summary" className="scroll-mt-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`relative rounded-2xl bg-white border ${card.accentBorder} p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_4px_12px_rgba(15,23,42,0.03)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(15,23,42,0.07)] hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs sm:text-[13px] font-medium text-slate-500 leading-snug">
                  {card.label}
                </span>
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div
                className={`font-display font-bold text-xl sm:text-2xl tracking-tight tabular-nums ${card.valueColor}`}
              >
                {card.value}
              </div>
              <p className="mt-1.5 text-[11px] sm:text-xs font-medium text-slate-500 truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

