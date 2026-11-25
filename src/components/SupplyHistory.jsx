import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Pencil,
  Trash2,
  Store,
  X,
  ReceiptText,
  StickyNote,
} from 'lucide-react';
import { formatPKR, formatPetti, formatPKDate, getTodayISO } from '../utils/format';

export default function SupplyHistory({ supplies, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredSupplies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return supplies
      .filter((item) => {
        const matchesShop =
          !q ||
          item.shopName.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        const matchesDate = !dateFilter || item.date === dateFilter;
        return matchesShop && matchesDate;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [supplies, searchQuery, dateFilter]);

  const filteredTotals = useMemo(() => {
    const qty = filteredSupplies.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const sales = filteredSupplies.reduce(
      (sum, s) => sum + Number(s.quantity || 0) * Number(s.pricePerPetti || 0),
      0
    );
    return { qty: Number(qty.toFixed(2)), sales };
  }, [filteredSupplies]);

  const hasFilters = Boolean(searchQuery.trim() || dateFilter);
  const todayISO = getTodayISO();

  return (
    <section
      id="history"
      aria-label="Supply History"
      className="scroll-mt-20 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.03)] overflow-hidden"
    >
      {/* Header & Filters */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                Supply History
              </h2>
              <p className="text-xs text-slate-500">
                {filteredSupplies.length}{' '}
                {filteredSupplies.length === 1 ? 'record' : 'records'} •{' '}
                <span className="font-semibold text-slate-700 tabular-nums">
                  {formatPetti(filteredTotals.qty)}
                </span>{' '}
                •{' '}
                <span className="font-semibold text-emerald-700 tabular-nums">
                  {formatPKR(filteredTotals.sales)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDateFilter(dateFilter === todayISO ? '' : todayISO)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                dateFilter === todayISO
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Today
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by shop or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-5 relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredSupplies.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <p className="font-display font-semibold text-slate-800 text-sm sm:text-base">
            {hasFilters ? 'No matching supply records found' : 'No egg supplies recorded yet'}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {hasFilters
              ? 'Try clearing your search or date filter.'
              : 'Use the Record Egg Supply form above to log your first delivery.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-2.5">
            {filteredSupplies.map((item) => {
              const total = Number(item.quantity) * Number(item.pricePerPetti);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-slate-900 text-[15px] truncate">
                        {item.shopName}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {formatPKDate(item.date)}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 font-bold text-xs tabular-nums">
                      {formatPetti(item.quantity)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2.5">
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Price / Petti
                      </span>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums">
                        {formatPKR(item.pricePerPetti)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Total Amount
                      </span>
                      <span className="font-display text-sm font-bold text-emerald-700 tabular-nums">
                        {formatPKR(total)}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <StickyNote className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{item.notes}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3">Date</th>
                  <th className="py-3.5 px-3">Shop / Customer</th>
                  <th className="py-3.5 px-3 text-right">Qty Supplied</th>
                  <th className="py-3.5 px-3 text-right">Price / Petti</th>
                  <th className="py-3.5 px-3 text-right">Total Amount</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSupplies.map((item) => {
                  const total = Number(item.quantity) * Number(item.pricePerPetti);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-4 pl-6 pr-3 whitespace-nowrap font-medium text-slate-600">
                        {formatPKDate(item.date)}
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-900">{item.shopName}</div>
                        {item.notes && (
                          <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs tabular-nums">
                          {formatPetti(item.quantity)}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right whitespace-nowrap font-medium text-slate-700 tabular-nums">
                        {formatPKR(item.pricePerPetti)}
                      </td>
                      <td className="py-4 px-3 text-right whitespace-nowrap font-display font-bold text-slate-900 tabular-nums">
                        {formatPKR(total)}
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            title="Edit supply"
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            title="Delete supply"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

