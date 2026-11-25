import React, { useState, useEffect } from 'react';
import { PackagePlus, Calendar, Hash, Banknote, StickyNote, AlertCircle, X, Check } from 'lucide-react';
import { formatPKR, getTodayISO } from '../utils/format';

export default function StockForm({ onSave, editingStock, onCancelEdit }) {
  const [date, setDate] = useState(getTodayISO());
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingStock) {
      setDate(editingStock.date || getTodayISO());
      setQuantity(String(editingStock.quantity ?? ''));
      setPurchasePrice(String(editingStock.purchasePrice ?? ''));
      setNotes(editingStock.notes || '');
      setError('');
    } else {
      setDate(getTodayISO());
      setQuantity('');
      setPurchasePrice('');
      setNotes('');
      setError('');
    }
  }, [editingStock]);

  const numericQty = Number(quantity) || 0;
  const numericPrice = Number(purchasePrice) || 0;
  const estimatedCost = numericQty > 0 && numericPrice > 0 ? numericQty * numericPrice : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const result = await onSave(
        {
          date,
          quantity: Number(quantity),
          purchasePrice: Number(purchasePrice),
          notes,
        },
        editingStock?.id
      );

      if (!result.ok) {
        setError(result.error || 'Could not save stock entry.');
        return;
      }

      if (!editingStock) {
        setQuantity('');
        setPurchasePrice('');
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
        editingStock ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/80'
      } p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.03)]`}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
              {editingStock ? 'Edit Stock Entry' : 'Add New Stock'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingStock
                ? 'Update incoming egg stock details'
                : 'Record incoming egg Petti purchased'}
            </p>
          </div>
        </div>
        {editingStock && (
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

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 text-xs sm:text-sm text-rose-700 animate-fade-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="font-medium leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Purchase Date
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity (Petti)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.5"
                required
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                className="w-full h-12 pl-10 pr-14 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-semibold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                Petti
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Purchase Price / Petti (PKR)
            </label>
            <div className="relative">
              <Banknote className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                inputMode="numeric"
                step="any"
                min="1"
                required
                placeholder="e.g. 6800"
                value={purchasePrice}
                onChange={(e) => {
                  setPurchasePrice(e.target.value);
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
              placeholder="e.g. Farm direct delivery, Grade A..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Purchase Cost Summary Strip */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Purchase Value
          </span>
          <span className="font-display font-bold text-base sm:text-lg text-slate-900 tabular-nums">
            {formatPKR(estimatedCost)}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-display font-bold text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <span>SAVING TO FIREBASE...</span>
          ) : editingStock ? (
            <>
              <Check className="w-4.5 h-4.5" />
              UPDATE STOCK ENTRY
            </>
          ) : (
            <>
              <PackagePlus className="w-4.5 h-4.5" />
              ADD STOCK ENTRY
            </>
          )}
        </button>
      </form>
    </div>
  );
}

