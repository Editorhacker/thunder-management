import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus } from 'react-icons/fa';
import './SnackSelector.css';

/* ---------------- TYPES ---------------- */

interface SnackItem {
  id: string;
  name: string;
  price: number;
  category: 'snack' | 'drink';
  emoji: string;
}

interface SelectedItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Props {
  onChange: (
    summary: string,
    totalCost: number,
    items: SelectedItem[]
  ) => void;
}

/* ---------------- INVENTORY ---------------- */

export const SNACK_INVENTORY: SnackItem[] = [
  // Snacks
  { id: 'chips', name: 'Chips', price: 15, category: 'snack', emoji: '🥔' },
  { id: 'cadbury', name: 'Cadbury', price: 15, category: 'snack', emoji: '🍫' },
  { id: 'doritos', name: 'Doritos', price: 20, category: 'snack', emoji: '🌮' },
  { id: 'maggie', name: 'Maggie', price: 25, category: 'snack', emoji: '🍜' },

  // Drinks
  { id: 'redbull', name: 'Redbull', price: 130, category: 'drink', emoji: '⚡' },
  { id: 'sting', name: 'Sting', price: 20, category: 'drink', emoji: '🥤' },
  { id: 'rio', name: 'Rio', price: 50, category: 'drink', emoji: '🍇' },
  { id: 'dietcoke', name: 'Diet Coke', price: 45, category: 'drink', emoji: '🥤' },
  { id: 'softdrink', name: 'Pepsi/Sprite', price: 25, category: 'drink', emoji: '🥤' },
  { id: 'water', name: 'Water', price: 15, category: 'drink', emoji: '💧' }
];

/* ---------------- COMPONENT ---------------- */

const SnackSelector: React.FC<Props> = ({ onChange }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'snack' | 'drink'>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  /* ---------- Emit change to parent (SAFE) ---------- */
  const emitChange = (nextQuantities: Record<string, number>) => {
    const items: SelectedItem[] = Object.entries(nextQuantities)
      .map(([id, qty]) => {
        const item = SNACK_INVENTORY.find(i => i.id === id);
        return item ? { ...item, qty } : null;
      })
      .filter(Boolean) as SelectedItem[];

    const summary =
      items.length > 0
        ? items.map(i => `${i.name} x${i.qty}`).join(', ')
        : '';

    const totalCost = items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    onChange(summary, totalCost, items);
  };

  /* ---------- Quantity handler ---------- */
  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);

      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;

      emitChange(updated); // 🔥 notify parent ONCE per user action
      return updated;
    });
  };

  /* ---------- Derived ---------- */
  const filteredItems = SNACK_INVENTORY.filter(
    item => activeTab === 'all' || item.category === activeTab
  );

  const totalCost = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const item = SNACK_INVENTORY.find(i => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  /* ---------------- JSX ---------------- */

  return (
    <div className="snack-selector-container">
      {/* Tabs */}
      <div className="selector-tabs">
        {(['all', 'snack', 'drink'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="snack-grid">
        <AnimatePresence>
          {filteredItems.map(item => {
            const qty = quantities[item.id] || 0;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`snack-card ${qty > 0 ? 'selected' : ''}`}
                onClick={() => updateQuantity(item.id, 1)}
              >
                <div className="snack-emoji">{item.emoji}</div>

                <div className="snack-details">
                  <span className="snack-name">{item.name}</span>
                  <span className="snack-price">₹{item.price}</span>
                </div>

                {qty > 0 ? (
                  <div
                    className="quantity-control"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="qty-btn minus"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <FaMinus size={10} />
                    </button>

                    <span className="qty-val">{qty}</span>

                    <button
                      className="qty-btn plus"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <FaPlus size={10} />
                    </button>
                  </div>
                ) : (
                  <div style={{ height: '32px' }} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Summary */}
      {totalCost > 0 && (
        <div className="selection-summary">
          <span className="summary-text">Total Snacks:</span>
          <span>₹{totalCost}</span>
        </div>
      )}
    </div>
  );
};

export default SnackSelector;
