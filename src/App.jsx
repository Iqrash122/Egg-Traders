import React, { useState, useRef, useEffect } from 'react';
import {
  Egg,
  CheckCircle2,
  AlertCircle,
  Truck,
  PackagePlus,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { useEggStore } from './hooks/useEggStore';
import { formatPetti, formatPKDate, formatPKR } from './utils/format';
import DashboardCards from './components/DashboardCards';
import StockForm from './components/StockForm';
import SupplyForm from './components/SupplyForm';
import SupplyHistory from './components/SupplyHistory';
import StockOverview from './components/StockOverview';
import ConfirmModal from './components/ConfirmModal';
import MobileBottomNav from './components/MobileBottomNav';

export default function App() {
  const {
    supplies,
    metrics,
    movements,
    shopSuggestions,
    loading,
    syncStatus,
    dbError,
    addStock,
    updateStock,
    deleteStock,
    addSupply,
    updateSupply,
    deleteSupply,
  } = useEggStore();

  // Active tab on mobile for the dual-form section ('supply' | 'stock')
  const [mobileFormTab, setMobileFormTab] = useState('supply');
  const [activeSection, setActiveSection] = useState('dashboard');

  // Edit states
  const [editingStock, setEditingStock] = useState(null);
  const [editingSupply, setEditingSupply] = useState(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState(null);

  // Toast feedback banner
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const shopInputRef = useRef(null);

  const showToast = (message, tone = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Scroll-spy for bottom nav highlight
  useEffect(() => {
    const sections = ['dashboard', 'actions', 'history', 'overview'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickSupply = () => {
    setEditingSupply(null);
    setMobileFormTab('supply');
    navigateToSection('actions');
    setTimeout(() => {
      shopInputRef.current?.focus();
    }, 350);
  };

  // Stock handlers (async Firestore)
  const handleSaveStock = async (payload, editId) => {
    const res = editId ? await updateStock(editId, payload) : await addStock(payload);
    if (res.ok) {
      setEditingStock(null);
      showToast(
        editId
          ? `Stock entry updated in Firebase (${formatPetti(payload.quantity)})`
          : `Saved ${formatPetti(payload.quantity)} stock to Firebase`
      );
    }
    return res;
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setMobileFormTab('stock');
    navigateToSection('actions');
  };

  const handleRequestDeleteStock = (stock) => {
    setConfirmState({
      title: 'Delete Stock Entry?',
      message: `Remove ${formatPetti(stock.quantity)} purchased on ${formatPKDate(
        stock.date
      )} (${formatPKR(stock.quantity * stock.purchasePrice)}) from Firebase? Dashboard totals will recalculate automatically.`,
      confirmLabel: 'Delete Stock',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteStock(stock.id);
        setConfirmState(null);
        if (res.ok) {
          if (editingStock?.id === stock.id) setEditingStock(null);
          showToast('Stock entry deleted from Firebase.');
        } else {
          showToast(res.error, 'error');
        }
      },
    });
  };

  // Supply handlers (async Firestore)
  const handleSaveSupply = async (payload, editId) => {
    const res = editId ? await updateSupply(editId, payload) : await addSupply(payload);
    if (res.ok) {
      setEditingSupply(null);
      showToast(
        editId
          ? `Updated supply for ${payload.shopName} in Firebase`
          : `Saved ${formatPetti(payload.quantity)} supply to ${payload.shopName} in Firebase`
      );
    }
    return res;
  };

  const handleEditSupply = (supply) => {
    setEditingSupply(supply);
    setMobileFormTab('supply');
    navigateToSection('actions');
  };

  const handleRequestDeleteSupply = (supply) => {
    setConfirmState({
      title: 'Delete Supply Record?',
      message: `Delete ${formatPetti(supply.quantity)} supplied to ${supply.shopName} on ${formatPKDate(
        supply.date
      )} (${formatPKR(supply.quantity * supply.pricePerPetti)}) from Firebase? Stock balance will be restored.`,
      confirmLabel: 'Delete Supply',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteSupply(supply.id);
        setConfirmState(null);
        if (res.ok) {
          if (editingSupply?.id === supply.id) setEditingSupply(null);
          showToast('Supply record deleted and stock restored.');
        } else {
          showToast(res.error, 'error');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-28 md:pb-14">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30 shrink-0">
              <Egg className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                Egg Supply Tracker
              </h1>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Daily Wholesale Stock &amp; Shop Supply Manager
              </p>
            </div>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div
              title={
                syncStatus === 'connected'
                  ? 'Live synced with Firebase Firestore (eggstraders)'
                  : syncStatus === 'connecting'
                    ? 'Connecting to Firebase Firestore...'
                    : dbError || 'Firebase connection error'
              }
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border ${
                syncStatus === 'connected'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : syncStatus === 'error'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {syncStatus === 'connected' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-sky-600" />
                  <span>Firebase DB</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>DB Error</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                  <span>Connecting…</span>
                </>
              )}
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tabular-nums border ${
                metrics.remainingStock <= 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : metrics.remainingStock <= 3
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  metrics.remainingStock <= 0
                    ? 'bg-rose-500'
                    : metrics.remainingStock <= 3
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
              />
              <span>{formatPetti(metrics.remainingStock)} left</span>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-40 animate-fade-slide-up">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.tone === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-200" />
            ) : (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Single-Page Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-6 sm:space-y-8">
        {/* Firebase DB Error Banner (if rules/connection issue) */}
        {dbError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3.5 text-sm text-rose-800"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Firebase Firestore Error</p>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{dbError}</p>
            </div>
          </div>
        )}

        {/* Loading indicator for initial Firestore fetch */}
        {loading && (
          <div className="flex items-center justify-center gap-2.5 rounded-2xl bg-white border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-xs">
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>Loading your live records from Firebase...</span>
          </div>
        )}

        {/* 1. Dashboard Summary Cards */}
        <DashboardCards metrics={metrics} />

        {/* 2 & 3. Record Egg Supply & Add New Stock Forms */}
        <section id="actions" aria-label="Stock and Supply Entry Forms" className="scroll-mt-20">
          {/* Compact Tab Switcher for Mobile (< lg) */}
          <div className="lg:hidden mb-3.5 grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-slate-200/75">
            <button
              type="button"
              onClick={() => setMobileFormTab('supply')}
              className={`h-11 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mobileFormTab === 'supply'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              Record Supply
            </button>
            <button
              type="button"
              onClick={() => setMobileFormTab('stock')}
              className={`h-11 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mobileFormTab === 'stock'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              Add New Stock
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Record Egg Supply */}
            <div
              className={`lg:col-span-7 ${
                mobileFormTab === 'supply' ? 'block' : 'hidden lg:block'
              }`}
            >
              <SupplyForm
                remainingStock={metrics.remainingStock}
                shopSuggestions={shopSuggestions}
                onSave={handleSaveSupply}
                editingSupply={editingSupply}
                onCancelEdit={() => setEditingSupply(null)}
                shopInputRef={shopInputRef}
              />
            </div>

            {/* Add New Stock */}
            <div
              className={`lg:col-span-5 ${
                mobileFormTab === 'stock' ? 'block' : 'hidden lg:block'
              }`}
            >
              <StockForm
                onSave={handleSaveStock}
                editingStock={editingStock}
                onCancelEdit={() => setEditingStock(null)}
              />
            </div>
          </div>
        </section>

        {/* 4. Supply History */}
        <SupplyHistory
          supplies={supplies}
          onEdit={handleEditSupply}
          onDelete={handleRequestDeleteSupply}
        />

        {/* 5. Stock Overview & Movement Ledger */}
        <StockOverview
          metrics={metrics}
          movements={movements}
          onEditStock={handleEditStock}
          onDeleteStock={handleRequestDeleteStock}
          onEditSupply={handleEditSupply}
          onDeleteSupply={handleRequestDeleteSupply}
        />
      </main>

      {/* Mobile Bottom Nav + Sticky Quick-Action Supply Button */}
      <MobileBottomNav
        activeSection={activeSection}
        onNavigate={navigateToSection}
        onQuickSupply={handleQuickSupply}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        onConfirm={() => confirmState?.onConfirm?.()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
