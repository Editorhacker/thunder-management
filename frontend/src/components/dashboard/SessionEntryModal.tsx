
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
interface ThunderPlayer {
    name: string;
    phone: string;
    thunderCoins: number;
    createdAt?: string;
    updatedAt?: string;
}


import DeviceDropdown from './DeviceDropdown';

import SnackSelector from './SnackSelector';

/* ---------------- MAIN ---------------- */

const SessionEntryModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [playerData, setPlayerData] = useState<ThunderPlayer | null>(null);

    const [isFetchingPlayer, setIsFetchingPlayer] = useState(false);
    const thunderCoins = playerData?.thunderCoins ?? 0;
    const playerFound = !!playerData;
    const [coinsApplied, setCoinsApplied] = useState(false);
const [coinDiscount, setCoinDiscount] = useState(0);
const coinsUsed = coinsApplied ? (coinDiscount / 20) * 50 : 0;




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
                'https://thunder-management.onrender.com/api/sessions/availability'
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

    useEffect(() => {

        // Require BOTH name + phone
        if (!form.customerName || form.contactNumber.length !== 10) {
            setPlayerData(null);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                setIsFetchingPlayer(true);

                const res = await axios.get(
                    "https://thunder-management.onrender.com/api/battles/thunder-player",
                    {
                        params: {
                            name: form.customerName.trim(),
                            phone: form.contactNumber
                        }
                    }
                );

                if (!cancelled) {
                    setPlayerData(res.data); // fetch ONCE
                }
setCoinsApplied(false);
setCoinDiscount(0);

            } catch (error) {
                if (!cancelled) setPlayerData(null);
            } finally {
                if (!cancelled) setIsFetchingPlayer(false);
            }
        }, 2000); // wait 2 seconds after user stops typing

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };

    }, [form.customerName, form.contactNumber]);



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
    const totalPrice = basePrice + snackCost - coinDiscount;


    const isHappyHour = isHappyHourTime();
    const isFunNight = !isHappyHour && isFunNightTime();
    const isNormalHour = !isHappyHour && !isFunNight && isNormalHourTime();

const redeemableBlocks = Math.floor(thunderCoins / 50);
const maxDiscount = redeemableBlocks * 20;

    /* ----------------------------------- */

    const startSession = async () => {
        try {
            if (!form.customerName) {
                alert("Please enter customer name");
                return;
            }

            await axios.post('https://thunder-management.onrender.com/api/sessions/start', {
                ...form,
                snackDetails: snackItems,
                duration: durationInHours,
                price: totalPrice,
                 thunderCoinsUsed: coinsUsed 
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
setCoinDiscount(0);
setCoinsApplied(false);
setPlayerData(prev =>
    prev ? { ...prev, thunderCoins: prev.thunderCoins - coinsUsed } : null
);


        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to start session ❌';
            alert(msg);
        }
    };


const toggleThunderCoins = () => {

    // Cancel if already applied
    if (coinsApplied) {
        setCoinsApplied(false);
        setCoinDiscount(0);
        return;
    }

    // Apply
    if (thunderCoins < 50) {
        alert("Minimum 50 Thunder Coins required ⚡");
        return;
    }

    const redeemableBlocks = Math.floor(thunderCoins / 50);
    const discount = redeemableBlocks * 20;

    setCoinDiscount(discount);
    setCoinsApplied(true);
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

                                <div className="field-group " >
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
                                    {/* Thunder Coins Display */}




                                </div>
                                <div className="field-group " >
                                    <label className="field-label">Thunder Coins</label>
                                    <div
                                        className="field-input"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            height: "42px",
                                            background: "#0f172a",
                                            border: "1px solid #334155",
                                            color: "#facc15",
                                            fontWeight: 600,
                                            gap: 8
                                        }}
                                    >
                                        {isFetchingPlayer && <span style={{ color: "#3b82f6" }}>Checking player...</span>}

                                        {!isFetchingPlayer && playerFound && (
                                            <>
                                                ⚡ {thunderCoins} Coins
                                            </>
                                        )}

                                        {!isFetchingPlayer && form.contactNumber.length === 10 && !playerFound && (
                                            <span style={{ color: "#10b981" }}>New Player</span>
                                        )}

                                        {!form.contactNumber && <span style={{ color: "#64748b" }}>Enter phone number</span>}
                                    </div>
                                </div>
                <div style={{ marginTop: 35, display: "flex", flexDirection: "column", gap: 6 }}>

    {/* Apply / Cancel Button */}
    <button
        type="button"
        onClick={toggleThunderCoins}
        disabled={thunderCoins < 50 && !coinsApplied}
        style={{
            width: "100%",
            height: "40px",
            fontSize: 13,
            borderRadius: 6,              // rectangular look
            border: "1px solid #334155",
            cursor: thunderCoins >= 50 || coinsApplied ? "pointer" : "not-allowed",
            background: coinsApplied ? "#ef4444" : (thunderCoins >= 50 ? "#eab308" : "#1e293b"),
            color: coinsApplied ? "#ffffff" : "#020617",
            fontWeight: 600,
            letterSpacing: 0.4,
            transition: "0.2s"
        }}
    >
        {coinsApplied ? "Cancel Thunder Coins" : "Apply Thunder Coins"}
    </button>

    {/* Discount message below */}
    {coinsApplied && (
        <div style={{
            fontSize: 12,
            color: "#22c55e",
            fontWeight: 500
        }}>
            ⚡ ₹{coinDiscount} discount applied
        </div>
    )}

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
        <div className="price-display" style={{ textAlign: "right" }}>

            <span className="price-label">Estimated Total</span>

            {/* Original price */}
            {coinDiscount > 0 && (
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Original: ₹{Math.round(basePrice + snackCost)}
                </div>
            )}

            {/* Thunder coin discount */}
            {coinDiscount > 0 && (
                <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
                    ⚡ Thunder Coins Discount: -₹{coinDiscount}
                </div>
            )}

            {/* Final price */}
            <span
                className="price-val"
                style={{
                    color: coinDiscount > 0 ? "#22c55e" : undefined,
                    fontSize: coinDiscount > 0 ? "1.4rem" : undefined
                }}
            >
                ₹{Math.round(totalPrice)}
            </span>

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
