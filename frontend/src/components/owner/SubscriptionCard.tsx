import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GradientTitle, ActionButton } from './ui/ModernComponents';
import { FaPlus, FaTimes } from 'react-icons/fa';
import './SubscriptionCard.css';

interface Subscription {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

const API = 'https://thunder-management.vercel.app//api/subscription';

const SubscriptionCard: React.FC = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 🔄 Fetch subscriptions
  const fetchSubscriptions = async () => {
    const res = await fetch(`${API}/subscriptions`);
    const data = await res.json();
    setSubs(data);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // ➕ Save subscription
  const handleSubmit = async () => {
    if (!name || !startDate || !endDate) return;

    await fetch(`${API}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate })
    });

    setName('');
    setStartDate('');
    setEndDate('');
    setOpen(false);

    fetchSubscriptions();
  };

  return (
    <>
      <GlassCard className="subscription-card">
        <div className="subscription-header">
          <GradientTitle size="medium">Subscriptions</GradientTitle>

          <ActionButton
            icon={FaPlus}
            label="Add Subscription"
            onClick={() => setOpen(true)}
          />
        </div>

        <div className="subscription-list">
          {subs.length === 0 && (
            <p className="empty-text">No subscriptions found</p>
          )}

          {subs.map(sub => (
            <div key={sub.id} className="subscription-item">
              <strong>{sub.name}</strong>
              <p>{sub.startDate} → {sub.endDate}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div className="modal-overlay">
            <motion.div className="modal-card">
              <div className="modal-header">
                <h3>Add Subscription</h3>
                <FaTimes onClick={() => setOpen(false)} />
              </div>

              <div className="modal-body">
                <input
                  placeholder="Subscription name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />

                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />

                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />

                <button className="submit-btn" onClick={handleSubmit}>
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubscriptionCard;
