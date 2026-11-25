import React, { useState, useEffect } from 'react';
import {
  Truck,
  Calendar,
  Store,
  Hash,
  Banknote,
  StickyNote,
  AlertTriangle,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatPKR, formatPetti, getTodayISO } from '../utils/format';

export default function SupplyForm({
  remainingStock,
  shopSuggestions,
  onSave,
  editingSupply,
  onCancelEdit,
  shopInputRef,
}) {
  const [date, setDate] = useState(getTodayISO());
  const [shopName, setShopName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerPetti, setPricePerPetti] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingSupply) {
      setDate(editingSupply.date || getTodayISO());
      setShopName(editingSupply.shopName || '');
      setQuantity(String(editingSupply.quantity ?? ''));
      setPricePerPetti(String(editingSupply.pricePerPetti ?? ''));
      setNotes(editingSupply.notes || '');
      setError('');
    } else {
      setDate(getTodayISO());
      setShopName('');
      setQuantity('');
      setPricePerPetti('');
      setNotes('');
      setError('');
    }
  }, [editingSupply]);

  // Max petti allowed for this form (includes old quantity when editing)
  const maxAllowed = editingSupply
    ? Number((remainingStock + Number(editingSupply.quantity || 0)).toFixed(2))
    : remainingStock;

  const numericQty = Number(quantity) || 0;
  const numericPrice = Number(pricePerPetti) || 0;
  const totalAmount = numericQty > 0 && numericPrice > 0 ? numericQty * numericPrice : 0;
  const isExceedingStock = numericQty > maxAllowed;
  const isNoStockAvailable = maxAllowed <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (isExceedingStock) {
      setError(
        `Insufficient stock! You only have ${formatPetti(maxAllowed)} available. Reduce quantity or add new stock first.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSave(
        {
          date,
          shopName,
          quantity: Number(quantity),
          pricePerPetti: Number(pricePerPetti),
          notes,
        },
        editingSupply?.id
      );

      if (!result.ok) {
        setError(result.error || 'Could not save supply.');
        return;
      }

      if (!editingSupply) {
        setShopName('');
        setQuantity('');
        setPricePerPetti('');
        setNotes('');
        setDate(getTodayISO());
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl bg-white border ${
        editingSupply
          ? 'border-amber-300 ring-2 ring-amber-100'
          : 'border-emerald-200/90 ring-1 ring-emerald-500/10'
      } p-5 sm:p-6 shadow-[0_2px_6px_rgba(16,185,129,0.06),0_8px_24px_rgba(15,23,42,0.04)]`}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
              {editingSupply ? 'Edit Egg Supply' : 'Record Egg Supply'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available to supply:{' '}
              <span
                className={`font-bold tabular-nums ${
                  maxAllowed <= 0
                    ? 'text-rose-600'
                    : maxAllowed <= 3
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                }`}
              >
                {formatPetti(maxAllowed)}
              </span>
            </p>
          </div>
        </div>
        {editingSupply && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>

      {/* Out of stock or insufficient stock live warning */}
      {(isNoStockAvailable || isExceedingStock || error) && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 text-xs sm:text-sm text-rose-700 animate-fade-slide-up"
        >
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-600" />
          <div className="font-medium leading-snug">
            {error ? (
              error
            ) : isNoStockAvailable ? (
              <span>
                <strong>No stock available!</strong> Please add new egg stock before recording a
                supply.
              </span>
            ) : (
              <span>
                <strong>Insufficient stock!</strong> Only{' '}
                <strong className="tabular-nums">{formatPetti(maxAllowed)}</strong> available —
                cannot supply <strong className="tabular-nums">{formatPetti(numericQty)}</strong>.
              </span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supply Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError('');
                }}
                className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Shop / Customer Name
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={shopInputRef}
                type="text"
                list="shop-suggestions"
                required
                placeholder="e.g. Ali General Store"
                value={shopName}
                onChange={(e) => {
                  setShopName(e.target.value);
                  setError('');
                }}
                className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              />
              <datalist id="shop-suggestions">
                {shopSuggestions.map((shop) => (
                  <option key={shop} value={shop} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Petti Supplied
              </label>
              {maxAllowed > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(String(maxAllowed));
                    setError('');
                  }}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Max: {maxAllowed}
                </button>
              )}
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.5"
                required
                placeholder="e.g. 3"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                className={`w-full h-12 pl-10 pr-14 rounded-xl border text-sm font-semibold tabular-nums focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  isExceedingStock
                    ? 'border-rose-400 bg-rose-50/60 text-rose-800 focus:ring-rose-500/25 focus:border-rose-500'
                    : 'border-slate-200 bg-slate-50/60 text-slate-900 focus:ring-emerald-500/25 focus:border-emerald-500'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                Petti
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Price Per Petti (PKR)
            </label>
            <div className="relative">
              <Banknote className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                inputMode="numeric"
                step="any"
                min="1"
                required
                placeholder="e.g. 7100"
                value={pricePerPetti}
                onChange={(e) => {
                  setPricePerPetti(e.target.value);
                  setError('');
                }}
                className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-semibold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                PKR
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Notes <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <StickyNote className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Cash received, EasyPaisa, morning delivery..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Auto-calculated Total Amount */}
        <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 px-4 py-3.5 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Total Amount
            </span>
            {numericQty > 0 && numericPrice > 0 && (
              <p className="text-[11px] text-emerald-700/80 font-medium tabular-nums mt-0.5">
                {numericQty} Petti × {formatPKR(numericPrice)}
              </p>
            )}
          </div>
          <span className="font-display font-extrabold text-xl sm:text-2xl text-emerald-800 tabular-nums">
            {formatPKR(totalAmount)}
          </span>
        </div>

        <button
          type="submit"
          disabled={isExceedingStock || isNoStockAvailable || submitting}
          className="w-full h-13 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-display font-bold text-sm sm:text-[15px] tracking-wide shadow-md shadow-emerald-600/25 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <span>SAVING TO FIREBASE...</span>
          ) : editingSupply ? (
            <>
              <Check className="w-5 h-5" />
              UPDATE SUPPLY
            </>
          ) : (
            <>
              <Truck className="w-5 h-5" />
              SAVE SUPPLY
            </>
          )}
        </button>
      </form>
    </div>
  );
}

