
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlaystation,
  FaDesktop,
  FaVrCardboard,
  FaChevronDown,
  FaRocket,
  FaUser,
  FaClock
} from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import axios from 'axios';
import './SessionEntry.css';

/* ---------------- TYPES ---------------- */

type DeviceKeys = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

interface DeviceCounts {
  ps: number;
  pc: number;
  vr: number;
  wheel: number;
  metabat: number;
}

interface FormState {
  customerName: string;
  contactNumber: string;
  duration: string;        // HH:MM
  peopleCount: number;
  snacks: string;
  devices: DeviceCounts;
}

/* ------------- DEVICE WIDGET (DROPDOWN) ------------ */

interface DeviceDropdownProps {
  label: string;
  limit: number;
  value: number;
  occupied: number[];
  icon: React.ReactNode;
  onChange: (val: number) => void;
}

const DeviceDropdown: React.FC<DeviceDropdownProps> = ({
  label,
  limit,
  value,
  occupied,
  icon,
  onChange
}) => {
  const isActive = value > 0;
  // It's "sold out" if all slots are occupied? No, we just show occupied per slot.
  // We can show "X available" by limit - occupied.length
  const availableCount = limit - occupied.length;
  const isEssentiallyFull = availableCount <= 0;

  return (
    <div className={`device-card-item ${isActive ? 'active' : ''} ${isEssentiallyFull ? 'sold-out' : ''}`}>
      <div className="device-icon-wrapper">
        {icon}
      </div>
      <div className="device-info">
        <span className="device-name">{label}</span>
        <span className="device-stock">
          {isEssentiallyFull ? 'Occupied' : `${availableCount} available`}
        </span>
      </div>

      {/* Dropdown Control */}
      <div className="dropdown-control" onClick={(e) => e.stopPropagation()}>
        <select
          className="mini-select"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        // Only disable if we want to lock it completely, but user wants to see "Occupied" too. 
        // Let's keep it enabled but disable options?
        // If value is 0 (unselected), and limit is full, we should probably still allow seeing the list?
        // But user said: "no you are getting the Logic entirely wrong ... I want you to substract the avilable device."
        // Wait, user said: "I dont want you to substract the avilable device." -> Show all.
        >
          <option value={0}>None</option>
          {Array.from({ length: limit }, (_, i) => i + 1).map(num => {
            const isTaken = occupied.includes(num);
            return (
              <option key={num} value={num} disabled={isTaken}>
                {num} {isTaken ? '(Occupied)' : ''}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

/* ---------------- MAIN ---------------- */

const SessionEntry: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const [form, setForm] = useState<FormState>({
    customerName: '',
    contactNumber: '',
    duration: "00:00",
    peopleCount: 1,
    snacks: '',
    devices: {
      ps: 0,
      pc: 0,
      vr: 0,
      wheel: 0,
      metabat: 0
    }
  });

  // State for availability
  const [availability, setAvailability] = useState<{
    limits: DeviceCounts;
    occupied: { [key in DeviceKeys]: number[] };
  }>({
    limits: { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 },
    occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
  });

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateDevice = (key: DeviceKeys, value: number) => {
    setForm(prev => ({
      ...prev,
      devices: { ...prev.devices, [key]: value }
    }));
  };

  const fetchAvailability = async () => {
    try {
      const res = await axios.get<{ limits: DeviceCounts; occupied: { [key in DeviceKeys]: number[] } }>( // Updated type for response
        'http://localhost:5000/api/sessions/availability'
      );
      setAvailability(res.data);
    } catch (e) {
      console.error("Failed to fetch availability", e);
    }
  };

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 30000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const PRICE_PER_HOUR_PER_PERSON = 50;

  /* ---------- SAFE DURATION ---------- */
  const durationStr = form.duration || "00:00";
  const parts = durationStr.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  const durationInHours = h + m / 60;

  const totalPrice =
    durationInHours * form.peopleCount * PRICE_PER_HOUR_PER_PERSON;
  /* ----------------------------------- */

  const startSession = async () => {
    try {
      if (!form.customerName) {
        alert("Please enter customer name");
        return;
      }

      await axios.post('http://localhost:5000/api/sessions/start', {
        ...form,
        duration: durationInHours,
        price: totalPrice
      });

      alert('Session started 🚀');

      // Reset form
      setForm({
        customerName: '',
        contactNumber: '',
        duration: "00:00",
        peopleCount: 1,
        snacks: '',
        devices: { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 }
      });

      // Re-fetch availability instantly
      fetchAvailability();

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to start session ❌';
      alert(msg);
    }
  };

  const snackOptions = [
    { label: "None", value: "" },
    { label: "Chips", value: "chips" },
    { label: "Drinks", value: "drinks" },
    { label: "Combo", value: "combo" }
  ];

  /* -----------------------------
     JSX
  ----------------------------- */
  return (
    <div className="session-card-container">
      {/* Header */}
      <div className="session-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="header-title">
          <div className="header-icon"><FaRocket /></div>
          <span>New Session</span>
        </div>
        <div className="toggle-icon" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <FaChevronDown />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="session-body-wrapper"
            style={{ overflow: 'hidden' }}
          >
            <div className="session-body">
              {/* Input Grid */}
              <div className="input-grid">
                <div className="field-group">
                  <label className="field-label">Customer Name</label>
                  <input
                    className="field-input"
                    placeholder="Enter name"
                    value={form.customerName}
                    onChange={e => updateField('customerName', e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Contact</label>
                  <input
                    className="field-input"
                    maxLength={10}
                    placeholder="10 Digits"
                    value={form.contactNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) updateField('contactNumber', val);
                    }}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Duration <span style={{ opacity: 0.5, fontWeight: 400 }}>(HH:MM)</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="field-input"
                      placeholder="00:00"
                      value={form.duration}
                      style={{ paddingLeft: '2.5rem' }}
                      onChange={e => {
                        let val = e.target.value.replace(/[^0-9:]/g, "");
                        if (val.length === 2 && !val.includes(":")) val = val + ":";
                        if (val.length > 5) return;
                        updateField("duration", val);
                      }}
                    />
                    <FaClock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">People Count</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="field-input"
                      min={1}
                      value={form.peopleCount}
                      style={{ paddingLeft: '2.5rem' }}
                      onChange={e => updateField('peopleCount', Math.max(1, Number(e.target.value)))}
                    />
                    <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                  </div>
                </div>

                <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">Snacks / Combo</label>
                  <select
                    className="field-input"
                    value={form.snacks}
                    style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
                    onChange={e => updateField('snacks', e.target.value)}
                  >
                    {snackOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Devices */}
              <div className="devices-section">
                <div className="section-label">Select Devices</div>
                <div className="devices-list">
                  <DeviceDropdown
                    icon={<FaPlaystation />}
                    label="PS5"
                    limit={availability.limits.ps} // Changed from max
                    value={form.devices.ps}
                    occupied={availability.occupied.ps || []} // New prop
                    onChange={v => updateDevice('ps', v)}
                  />

                  <DeviceDropdown
                    icon={<FaDesktop />}
                    label="PC"
                    limit={availability.limits.pc} // Changed from max
                    value={form.devices.pc}
                    occupied={availability.occupied.pc || []} // New prop
                    onChange={v => updateDevice('pc', v)}
                  />

                  <DeviceDropdown
                    icon={<FaVrCardboard />}
                    label="VR"
                    limit={availability.limits.vr} // Changed from max
                    value={form.devices.vr}
                    occupied={availability.occupied.vr || []} // New prop
                    onChange={v => updateDevice('vr', v)}
                  />

                  <DeviceDropdown
                    icon={<GiSteeringWheel />}
                    label="Wheel"
                    limit={availability.limits.wheel} // Changed from max
                    value={form.devices.wheel}
                    occupied={availability.occupied.wheel || []} // New prop
                    onChange={v => updateDevice('wheel', v)}
                  />

                  <DeviceDropdown
                    icon={<GiCricketBat />}
                    label="MetaBat"
                    limit={availability.limits.metabat} // Changed from max
                    value={form.devices.metabat}
                    occupied={availability.occupied.metabat || []} // New prop
                    onChange={v => updateDevice('metabat', v)}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="action-footer">
                <div className="price-display">
                  <span className="price-label">Estimated Total</span>
                  <span className="price-val">₹{Math.round(totalPrice)}</span>
                </div>

                <button
                  className="start-session-btn"
                  onClick={startSession}
                  disabled={!form.customerName || (durationInHours <= 0)}
                >
                  <span>Start Session</span>
                  <FaChevronDown style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionEntry;