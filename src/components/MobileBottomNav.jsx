import React from 'react';
import { LayoutDashboard, ClipboardList, ReceiptText, Layers, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
  { id: 'actions', label: 'Entry', icon: ClipboardList },
  { id: 'history', label: 'History', icon: ReceiptText },
  { id: 'overview', label: 'Stock', icon: Layers },
];

export default function MobileBottomNav({ activeSection, onNavigate, onQuickSupply }) {
  return (
    <>
      {/* Sticky Quick-Action Button for Adding a Supply */}
      <button
        type="button"
        onClick={onQuickSupply}
        aria-label="Quick Record Egg Supply"
        className="fixed z-30 right-4 bottom-20 md:bottom-6 md:right-6 inline-flex items-center gap-2 h-12 px-4 sm:px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-display font-bold text-sm shadow-lg shadow-emerald-600/35 transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5" strokeWidth={2.6} />
        <span>Record Supply</span>
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      >
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-emerald-50' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                </div>
                <span className="text-[11px] font-semibold leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

