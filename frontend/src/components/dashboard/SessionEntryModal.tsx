
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlaystation,
    FaDesktop,
    FaVrCardboard,
    FaRocket,
    FaUser,
    FaClock,
    FaTimes
} from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import axios from 'axios';
import './SessionEntry.css';
import './UpdateSessionModal.css'; // Reuse modal styles
import { calculateSessionPrice, isFunNightTime, isNormalHourTime, isHappyHourTime } from '../../utils/pricing';

/* ---------------- TYPES ---------------- */

type DeviceKeys = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

interface DeviceCounts {
    ps: number[];
    pc: number[];
    vr: number[];
    wheel: number[];
    metabat: number[];
}

interface FormState {
    customerName: string;
    contactNumber: string;
    duration: string;        // HH:MM
    peopleCount: number;
    snacks: string;
    devices: DeviceCounts;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

import DeviceDropdown from './DeviceDropdown';

import SnackSelector from './SnackSelector';

/* ---------------- MAIN ---------------- */

const SessionEntryModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [form, setForm] = useState<FormState>({
        customerName: '',
        contactNumber: '',
        duration: "00:00",
        peopleCount: 1,
        snacks: '',
        devices: {
            ps: [],
            pc: [],
            vr: [],
            wheel: [],
            metabat: []
        }
    });

    // State for availability
    const [availability, setAvailability] = useState<{
        limits: Record<DeviceKeys, number>;
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

    const updateDevice = (key: DeviceKeys, value: number[]) => {
        setForm(prev => ({
            ...prev,
            devices: { ...prev.devices, [key]: value }
        }));
    };

    const fetchAvailability = async () => {
        try {
            const res = await axios.get<{ limits: Record<DeviceKeys, number>; occupied: { [key in DeviceKeys]: number[] } }>(
                'https://thunder-management.vercel.app//api/sessions/availability'
            );
            setAvailability(res.data);
        } catch (e) {
            console.error("Failed to fetch availability", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAvailability();
            const interval = setInterval(fetchAvailability, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [isOpen]);


    const [snackCost, setSnackCost] = useState<number>(0);
    const [snackItems, setSnackItems] = useState<{ name: string; quantity: number }[]>([]);

    /* ---------- SAFE DURATION ---------- */
    const durationStr = form.duration || "00:00";
    const parts = durationStr.split(":");
    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;
    const durationInHours = h + m / 60;

    // Pricing Logic
    const deviceMap = (form.devices as unknown) as Record<string, number[]>;
    const basePrice = calculateSessionPrice(
        durationInHours,
        form.peopleCount,
        deviceMap
    );
    const totalPrice = basePrice + snackCost;

    const isHappyHour = isHappyHourTime();
    const isFunNight = !isHappyHour && isFunNightTime();
    const isNormalHour = !isHappyHour && !isFunNight && isNormalHourTime();


    /* ----------------------------------- */

    const startSession = async () => {
        try {
            if (!form.customerName) {
                alert("Please enter customer name");
                return;
            }

            await axios.post('https://thunder-management.vercel.app//api/sessions/start', {
                ...form,
                snackDetails: snackItems,
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
                devices: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
            });
            setSnackItems([]); // Reset snacks

            onClose(); // Close modal on success

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to start session ❌';
            alert(msg);
        }
    };



    /* -----------------------------
       JSX
    ----------------------------- */
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-backdrop">
                    <motion.div
                        className="modal-container"
                        style={{ maxWidth: '800px' }} // Wider for this form
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaRocket className="text-blue-500" /> Start New Session
                                {isHappyHour && (
                                    <span
                                        style={{
                                            color: '#16a34a',
                                            fontSize: '0.7em',
                                            border: '1px solid #16a34a',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            marginLeft: 8
                                        }}
                                    >
                                        ⏰ Happy Hour
                                    </span>
                                )}

                                {isFunNight && (
                                    <span
                                        style={{
                                            color: '#ec4899',
                                            fontSize: '0.7em',
                                            border: '1px solid #ec4899',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            marginLeft: 8
                                        }}
                                    >
                                        🌙 Fun Night
                                    </span>
                                )}

                                {isNormalHour && (
                                    <span
                                        style={{
                                            color: '#3b82f6',
                                            fontSize: '0.7em',
                                            border: '1px solid #3b82f6',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            marginLeft: 8
                                        }}
                                    >
                                        ☀️ Normal Hour
                                    </span>
                                )}

                            </h2>
                            <button className="close-icon-btn" onClick={onClose}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="content-wrapper custom-scrollbar" style={{ paddingTop: '1rem', overflowY: 'auto', maxHeight: '80vh' }}>
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
                                    <label className="field-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Snacks / Combo</label>
                                    <SnackSelector
                                        onChange={(val, cost, items) => {
                                            updateField('snacks', val);
                                            setSnackCost(cost);
                                            // Map to backend expected format
                                            setSnackItems(items.map(i => ({ name: i.name, quantity: i.qty })));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Devices */}
                            <div className="devices-section">
                                <div className="section-label">Select Devices</div>
                                <div className="devices-list">
                                    <DeviceDropdown
                                        icon={<FaPlaystation />}
                                        label="PS5"
                                        limit={availability.limits.ps}
                                        value={form.devices.ps}
                                        occupied={availability.occupied.ps || []}
                                        onChange={v => updateDevice('ps', v)}
                                    />

                                    <DeviceDropdown
                                        icon={<FaDesktop />}
                                        label="PC"
                                        limit={availability.limits.pc}
                                        value={form.devices.pc}
                                        occupied={availability.occupied.pc || []}
                                        onChange={v => updateDevice('pc', v)}
                                    />

                                    <DeviceDropdown
                                        icon={<FaVrCardboard />}
                                        label="VR"
                                        limit={availability.limits.vr}
                                        value={form.devices.vr}
                                        occupied={availability.occupied.vr || []}
                                        onChange={v => updateDevice('vr', v)}
                                    />

                                    <DeviceDropdown
                                        icon={<GiSteeringWheel />}
                                        label="Wheel"
                                        limit={availability.limits.wheel}
                                        value={form.devices.wheel}
                                        occupied={availability.occupied.wheel || []}
                                        onChange={v => updateDevice('wheel', v)}
                                    />

                                    <DeviceDropdown
                                        icon={<GiCricketBat />}
                                        label="MetaBat"
                                        limit={availability.limits.metabat}
                                        value={form.devices.metabat}
                                        occupied={availability.occupied.metabat || []}
                                        onChange={v => updateDevice('metabat', v)}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Footer - Moved outside scroller for stickiness */}
                        <div className="action-bar" style={{ borderRadius: '0 0 24px 24px' }}>
                            {Object.values(form.devices).some(val => val.length > 0) && (
                                <div className="price-display">
                                    <span className="price-label">Estimated Total</span>
                                    <span className="price-val">₹{Math.round(totalPrice)}</span>
                                </div>
                            )}

                            <button
                                className="start-session-btn"
                                onClick={startSession}
                                disabled={!form.customerName || (durationInHours <= 0) || !Object.values(form.devices).some(val => val.length > 0)}
                                style={{ height: '42px', boxShadow: 'none' }} // Adjust to fit modal footer
                            >
                                Start Session
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SessionEntryModal;
