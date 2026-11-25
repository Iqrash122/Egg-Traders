import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  PackageCheck,
} from 'lucide-react';
import { formatPKR, formatPetti, formatPKDate } from '../utils/format';

export default function StockOverview({
  metrics,
  movements,
  onEditStock,
  onDeleteStock,
  onEditSupply,
  onDeleteSupply,
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'IN' | 'OUT'

  const filteredMovements = useMemo(() => {
    if (filter === 'ALL') return movements;
    return movements.filter((m) => m.type === filter);
  }, [movements, filter]);

  const suppliedPercent =
    metrics.totalReceived > 0
      ? Math.min(100, Math.round((metrics.totalSupplied / metrics.totalReceived) * 100))
      : 0;
  const remainingPercent = Math.max(0, 100 - suppliedPercent);

  return (
    <section
      id="overview"
      aria-label="Stock Overview and Movement History"
      className="scroll-mt-20 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.03)] overflow-hidden"
    >
      {/* Top Overview Header & Visual Stock Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                Stock Overview &amp; Movement Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Track every Petti purchased, supplied, and remaining balance
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'IN', label: 'Stock In' },
              { key: 'OUT', label: 'Supplied' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === tab.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Summary Stat Tiles */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 sm:p-4">
            <span className="block text-[11px] sm:text-xs font-medium text-slate-500">
              Total Purchased
            </span>
            <span className="block font-display font-bold text-base sm:text-xl text-slate-900 tabular-nums mt-1">
              {formatPetti(metrics.totalReceived)}
            </span>
          </div>
          <div className="rounded-xl bg-sky-50/70 border border-sky-200/60 p-3 sm:p-4">
            <span className="block text-[11px] sm:text-xs font-medium text-sky-700">
              Total Supplied
            </span>
            <span className="block font-display font-bold text-base sm:text-xl text-sky-900 tabular-nums mt-1">
              {formatPetti(metrics.totalSupplied)}
            </span>
          </div>
          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/70 p-3 sm:p-4">
            <span className="block text-[11px] sm:text-xs font-medium text-emerald-700">
              Available Now
            </span>
            <span className="block font-display font-bold text-base sm:text-xl text-emerald-800 tabular-nums mt-1">
              {formatPetti(metrics.remainingStock)}
            </span>
          </div>
        </div>

        {/* Utilization Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>Stock Utilization</span>
            <span className="tabular-nums">
              <strong className="text-slate-700">{suppliedPercent}%</strong> supplied •{' '}
              <strong className="text-emerald-700">{remainingPercent}%</strong> remaining
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-slate-800 transition-all duration-500"
              style={{ width: `${suppliedPercent}%` }}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Movement History List */}
      {filteredMovements.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
            <PackageCheck className="w-5 h-5" />
          </div>
          <p className="font-display font-semibold text-slate-800 text-sm">
            No stock movements to display
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Add incoming stock or record a supply to see the movement timeline.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredMovements.map((m) => {
            const isIn = m.type === 'IN';
            return (
              <div
                key={`${m.type}_${m.id}`}
                className="px-4 sm:px-6 py-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${
                      isIn
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-4.5 h-4.5" strokeWidth={2.4} />
                    ) : (
                      <ArrowUpRight className="w-4.5 h-4.5" strokeWidth={2.4} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {m.title}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                          isIn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isIn ? 'Stock In' : 'Supplied'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                      <span>{formatPKDate(m.date)}</span>
                      <span>•</span>
                      <span className="tabular-nums">{formatPKR(m.unitPrice)} / Petti</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {formatPKR(m.totalAmount)}
                      </span>
                    </div>
                    {m.notes && (
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{m.notes}</p>
                    )}
                  </div>
                </div>

                {/* Right side: Quantity delta, Running Balance, Edit/Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                  <div className="sm:text-right">
                    <div
                      className={`font-display font-bold text-sm sm:text-[15px] tabular-nums ${
                        isIn ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isIn ? '+' : '−'}
                      {formatPetti(m.quantity)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 tabular-nums">
                      Balance: {formatPetti(m.balanceAfter)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-100 pl-2.5">
                    <button
                      type="button"
                      title={isIn ? 'Edit stock entry' : 'Edit supply entry'}
                      onClick={() => (isIn ? onEditStock(m.raw) : onEditSupply(m.raw))}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={isIn ? 'Delete stock entry' : 'Delete supply entry'}
                      onClick={() => (isIn ? onDeleteStock(m.raw) : onDeleteSupply(m.raw))}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

