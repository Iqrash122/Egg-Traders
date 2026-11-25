import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, trackEvent } from '../firebase';
import { generateId } from '../utils/format';

const STOCKS_COL = 'stocks';
const SUPPLIES_COL = 'supplies';

function normalizeDateString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val?.toDate === 'function') {
    return val.toDate().toISOString().slice(0, 10);
  }
  return String(val);
}

function normalizeTimestampString(val, fallbackDate) {
  if (!val) return `${fallbackDate || '2026-01-01'}T12:00:00.000Z`;
  if (typeof val === 'string') return val;
  if (typeof val?.toDate === 'function') return val.toDate().toISOString();
  return String(val);
}

function normalizeStock(raw, idFallback) {
  const date = normalizeDateString(raw?.date);
  return {
    id: raw?.id || idFallback || generateId('stk'),
    date,
    quantity: Number(raw?.quantity) || 0,
    purchasePrice: Number(raw?.purchasePrice) || 0,
    notes: typeof raw?.notes === 'string' ? raw.notes : '',
    createdAt: normalizeTimestampString(raw?.createdAt, date),
  };
}

function normalizeSupply(raw, idFallback) {
  const date = normalizeDateString(raw?.date);
  const quantity = Number(raw?.quantity) || 0;
  const pricePerPetti = Number(raw?.pricePerPetti) || 0;
  return {
    id: raw?.id || idFallback || generateId('sup'),
    date,
    shopName: typeof raw?.shopName === 'string' ? raw.shopName : 'Unknown Shop',
    quantity,
    pricePerPetti,
    totalAmount: Number(raw?.totalAmount) || Number((quantity * pricePerPetti).toFixed(2)),
    notes: typeof raw?.notes === 'string' ? raw.notes : '',
    createdAt: normalizeTimestampString(raw?.createdAt, date),
  };
}

function formatFirebaseError(err) {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return 'Firebase permission denied. Please check your Cloud Firestore security rules in Firebase Console.';
  }
  if (code === 'unavailable') {
    return 'Cannot reach Firebase Firestore. Please check your internet connection.';
  }
  return err?.message || 'Firebase database operation failed.';
}

export function useEggStore() {
  const [stocks, setStocks] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  // 'connecting' | 'connected' | 'error'
  const [syncStatus, setSyncStatus] = useState('connecting');
  const [dbError, setDbError] = useState('');

  // Subscribe to real-time Cloud Firestore collections
  useEffect(() => {
    if (!db) {
      setSyncStatus('error');
      setDbError('Firebase Firestore is not initialized.');
      setLoading(false);
      return;
    }

    let stocksReady = false;
    let suppliesReady = false;

    const markReady = () => {
      if (stocksReady && suppliesReady) {
        setLoading(false);
      }
    };

    const handleSnapshotError = (err) => {
      console.error('Firestore listener error:', err);
      setSyncStatus('error');
      setDbError(formatFirebaseError(err));
      setLoading(false);
    };

    const unsubStocks = onSnapshot(
      collection(db, STOCKS_COL),
      (snapshot) => {
        const list = snapshot.docs.map((d) => normalizeStock(d.data(), d.id));
        setStocks(list);
        stocksReady = true;
        setSyncStatus('connected');
        setDbError('');
        markReady();
      },
      handleSnapshotError
    );

    const unsubSupplies = onSnapshot(
      collection(db, SUPPLIES_COL),
      (snapshot) => {
        const list = snapshot.docs.map((d) => normalizeSupply(d.data(), d.id));
        setSupplies(list);
        suppliesReady = true;
        setSyncStatus('connected');
        setDbError('');
        markReady();
      },
      handleSnapshotError
    );

    return () => {
      unsubStocks();
      unsubSupplies();
    };
  }, []);

  // Core automatically recalculated metrics
  const metrics = useMemo(() => {
    const totalReceived = stocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const totalSupplied = supplies.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const remainingStock = Math.max(0, Number((totalReceived - totalSupplied).toFixed(2)));
    const totalSales = supplies.reduce(
      (sum, s) => sum + Number(s.quantity || 0) * Number(s.pricePerPetti || 0),
      0
    );
    const totalPurchaseCost = stocks.reduce(
      (sum, s) => sum + Number(s.quantity || 0) * Number(s.purchasePrice || 0),
      0
    );
    const avgSellingPrice = totalSupplied > 0 ? Math.round(totalSales / totalSupplied) : 0;
    const avgPurchasePrice = totalReceived > 0 ? Math.round(totalPurchaseCost / totalReceived) : 0;

    return {
      totalReceived: Number(totalReceived.toFixed(2)),
      totalSupplied: Number(totalSupplied.toFixed(2)),
      remainingStock,
      totalSales,
      totalPurchaseCost,
      avgSellingPrice,
      avgPurchasePrice,
    };
  }, [stocks, supplies]);

  // Unique shop names for quick autocomplete suggestions
  const shopSuggestions = useMemo(() => {
    const set = new Set();
    supplies.forEach((s) => {
      if (s.shopName && s.shopName.trim()) set.add(s.shopName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [supplies]);

  // Unified chronological stock movement ledger with running balance
  const movements = useMemo(() => {
    const combined = [
      ...stocks.map((s) => ({
        id: s.id,
        type: 'IN',
        date: s.date,
        createdAt: s.createdAt || `${s.date}T08:00:00.000Z`,
        title: 'Stock Purchased',
        quantity: Number(s.quantity),
        unitPrice: Number(s.purchasePrice),
        totalAmount: Number(s.quantity) * Number(s.purchasePrice),
        notes: s.notes || '',
        raw: s,
      })),
      ...supplies.map((s) => ({
        id: s.id,
        type: 'OUT',
        date: s.date,
        createdAt: s.createdAt || `${s.date}T12:00:00.000Z`,
        title: s.shopName,
        quantity: Number(s.quantity),
        unitPrice: Number(s.pricePerPetti),
        totalAmount: Number(s.quantity) * Number(s.pricePerPetti),
        notes: s.notes || '',
        raw: s,
      })),
    ];

    combined.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.createdAt !== b.createdAt) return a.createdAt.localeCompare(b.createdAt);
      if (a.type !== b.type) return a.type === 'IN' ? -1 : 1;
      return 0;
    });

    let runningBalance = 0;
    const withBalance = combined.map((item) => {
      runningBalance = Number(
        (runningBalance + (item.type === 'IN' ? item.quantity : -item.quantity)).toFixed(2)
      );
      return {
        ...item,
        balanceAfter: runningBalance,
      };
    });

    return withBalance.reverse();
  }, [stocks, supplies]);

  // Add new stock entry to Firestore
  const addStock = useCallback(async ({ date, quantity, purchasePrice, notes }) => {
    if (!db) return { ok: false, error: 'Firebase database is not connected.' };

    const qty = Number(quantity);
    const price = Number(purchasePrice);
    if (!date) return { ok: false, error: 'Please select a valid date.' };
    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: 'Quantity must be greater than 0 Petti.' };
    }
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: 'Purchase price per Petti must be greater than 0 PKR.' };
    }

    const newStock = {
      id: generateId('stk'),
      date,
      quantity: qty,
      purchasePrice: price,
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, STOCKS_COL, newStock.id), newStock);
      trackEvent('add_stock', { quantity: qty, value: qty * price });
      return { ok: true, record: newStock };
    } catch (err) {
      console.error('Failed to add stock in Firestore:', err);
      return { ok: false, error: formatFirebaseError(err) };
    }
  }, []);

  // Update existing stock entry in Firestore
  const updateStock = useCallback(
    async (id, { date, quantity, purchasePrice, notes }) => {
      if (!db) return { ok: false, error: 'Firebase database is not connected.' };

      const existing = stocks.find((s) => s.id === id);
      if (!existing) return { ok: false, error: 'Stock record not found.' };

      const qty = Number(quantity);
      const price = Number(purchasePrice);
      if (!date) return { ok: false, error: 'Please select a valid date.' };
      if (!Number.isFinite(qty) || qty <= 0) {
        return { ok: false, error: 'Quantity must be greater than 0 Petti.' };
      }
      if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, error: 'Purchase price per Petti must be greater than 0 PKR.' };
      }

      const projectedTotalReceived = metrics.totalReceived - Number(existing.quantity) + qty;
      if (projectedTotalReceived < metrics.totalSupplied) {
        const minAllowed = Number(
          (metrics.totalSupplied - (metrics.totalReceived - Number(existing.quantity))).toFixed(2)
        );
        return {
          ok: false,
          error: `Cannot reduce stock to ${qty} Petti. You have already supplied ${metrics.totalSupplied} Petti, so this entry must be at least ${minAllowed} Petti.`,
        };
      }

      const updatedRecord = {
        ...existing,
        date,
        quantity: qty,
        purchasePrice: price,
        notes: (notes || '').trim(),
      };

      try {
        await setDoc(doc(db, STOCKS_COL, id), updatedRecord);
        trackEvent('edit_stock', { quantity: qty });
        return { ok: true };
      } catch (err) {
        console.error('Failed to update stock in Firestore:', err);
        return { ok: false, error: formatFirebaseError(err) };
      }
    },
    [stocks, metrics.totalReceived, metrics.totalSupplied]
  );

  // Delete stock entry from Firestore
  const deleteStock = useCallback(
    async (id) => {
      if (!db) return { ok: false, error: 'Firebase database is not connected.' };

      const existing = stocks.find((s) => s.id === id);
      if (!existing) return { ok: false, error: 'Stock record not found.' };

      const projectedTotalReceived = metrics.totalReceived - Number(existing.quantity);
      if (projectedTotalReceived < metrics.totalSupplied) {
        return {
          ok: false,
          error: `Cannot delete this ${existing.quantity} Petti stock entry because ${metrics.totalSupplied} Petti have already been supplied. Delete or reduce supply records first.`,
        };
      }

      try {
        await deleteDoc(doc(db, STOCKS_COL, id));
        trackEvent('delete_stock');
        return { ok: true };
      } catch (err) {
        console.error('Failed to delete stock from Firestore:', err);
        return { ok: false, error: formatFirebaseError(err) };
      }
    },
    [stocks, metrics.totalReceived, metrics.totalSupplied]
  );

  // Add new supply entry to Firestore
  const addSupply = useCallback(
    async ({ date, shopName, quantity, pricePerPetti, notes }) => {
      if (!db) return { ok: false, error: 'Firebase database is not connected.' };

      const shop = (shopName || '').trim();
      const qty = Number(quantity);
      const price = Number(pricePerPetti);

      if (!date) return { ok: false, error: 'Please select a supply date.' };
      if (!shop) return { ok: false, error: 'Please enter a shop or customer name.' };
      if (!Number.isFinite(qty) || qty <= 0) {
        return { ok: false, error: 'Supplied quantity must be greater than 0 Petti.' };
      }
      if (qty > metrics.remainingStock) {
        return {
          ok: false,
          error: `Insufficient stock! Only ${metrics.remainingStock} Petti available, cannot supply ${qty} Petti.`,
        };
      }
      if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, error: 'Price per Petti must be greater than 0 PKR.' };
      }

      const newSupply = {
        id: generateId('sup'),
        date,
        shopName: shop,
        quantity: qty,
        pricePerPetti: price,
        totalAmount: Number((qty * price).toFixed(2)),
        notes: (notes || '').trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, SUPPLIES_COL, newSupply.id), newSupply);
        trackEvent('record_supply', { quantity: qty, value: newSupply.totalAmount });
        return { ok: true, record: newSupply };
      } catch (err) {
        console.error('Failed to save supply in Firestore:', err);
        return { ok: false, error: formatFirebaseError(err) };
      }
    },
    [metrics.remainingStock]
  );

  // Update existing supply entry in Firestore
  const updateSupply = useCallback(
    async (id, { date, shopName, quantity, pricePerPetti, notes }) => {
      if (!db) return { ok: false, error: 'Firebase database is not connected.' };

      const existing = supplies.find((s) => s.id === id);
      if (!existing) return { ok: false, error: 'Supply record not found.' };

      const shop = (shopName || '').trim();
      const qty = Number(quantity);
      const price = Number(pricePerPetti);

      if (!date) return { ok: false, error: 'Please select a supply date.' };
      if (!shop) return { ok: false, error: 'Please enter a shop or customer name.' };
      if (!Number.isFinite(qty) || qty <= 0) {
        return { ok: false, error: 'Supplied quantity must be greater than 0 Petti.' };
      }

      const maxAllowed = Number((metrics.remainingStock + Number(existing.quantity)).toFixed(2));
      if (qty > maxAllowed) {
        return {
          ok: false,
          error: `Insufficient stock! Maximum allowed for this supply is ${maxAllowed} Petti.`,
        };
      }
      if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, error: 'Price per Petti must be greater than 0 PKR.' };
      }

      const updatedRecord = {
        ...existing,
        date,
        shopName: shop,
        quantity: qty,
        pricePerPetti: price,
        totalAmount: Number((qty * price).toFixed(2)),
        notes: (notes || '').trim(),
      };

      try {
        await setDoc(doc(db, SUPPLIES_COL, id), updatedRecord);
        trackEvent('edit_supply', { quantity: qty, value: updatedRecord.totalAmount });
        return { ok: true };
      } catch (err) {
        console.error('Failed to update supply in Firestore:', err);
        return { ok: false, error: formatFirebaseError(err) };
      }
    },
    [supplies, metrics.remainingStock]
  );

  // Delete supply entry from Firestore
  const deleteSupply = useCallback(async (id) => {
    if (!db) return { ok: false, error: 'Firebase database is not connected.' };
    try {
      await deleteDoc(doc(db, SUPPLIES_COL, id));
      trackEvent('delete_supply');
      return { ok: true };
    } catch (err) {
      console.error('Failed to delete supply from Firestore:', err);
      return { ok: false, error: formatFirebaseError(err) };
    }
  }, []);

  return {
    stocks,
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
  };
}
