
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes, FaDesktop, FaGamepad, FaClock, FaUserPlus, FaPizzaSlice, FaMinus, FaPlus, FaChevronRight, FaTrash, FaVrCardboard } from "react-icons/fa";
import { GiSteeringWheel, GiCricketBat } from "react-icons/gi";
import "./UpdateSessionModal.css";
import SnackSelector from './SnackSelector';
import DeviceDropdown from './DeviceDropdown';
import { calculateSessionPrice } from '../../utils/pricing';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

// ------------------- Types -------------------
interface DeviceMap {
    ps: number[];
    pc: number[];
    vr: number[];
    wheel: number[];
    metabat: number[];
}

interface Availability {
    limits: Record<string, number>;
    occupied: {
        ps: number[];
        pc: number[];
        vr: number[];
        wheel: number[];
        metabat: number[];
    };
}

interface ActiveSession {
    id: string;
    customer: string;
    startTime: string;
    duration: number;
    peopleCount: number;
    price: number;
    paidAmount?: number;
    remainingPeople?: number;  // Changed from paidPeople
    remainingAmount?: number;
    devices: { type: string; id: number | null }[]; // Updated structure
}

interface Props {
    session: ActiveSession;
    onClose: () => void;
}

// ------------------- Constants -------------------
// const PRICE_PER_HOUR_PER_PERSON = 50; // Removed unused



const UpdateSessionModal = ({ session, onClose }: Props) => {
    // ------------------- State -------------------
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { user } = useAuth();

    // Replaced single payingNow state with toggles
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('online');
    const [payingNowCount, setPayingNowCount] = useState(0);

    const [customPayAmount, setCustomPayAmount] = useState<number | ''>('');
    const [paymentMode, setPaymentMode] = useState<'equal' | 'custom'>('equal');

    // Derived total people paying now
    const payingNow = paymentMode === 'equal' ? payingNowCount : 1;


    // Feature 1: Extend Time
    const [extraMinutes, setExtraMinutes] = useState(0);

    // Feature 2: Add Member & Availability
    const [availability, setAvailability] = useState<Availability>({
        limits: { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 },
        occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
    });

    useEffect(() => {
        axios.get('https://thunder-management.onrender.com/api/sessions/availability')
            .then(res => setAvailability(res.data))
            .catch(err => console.error("Failed to fetch availability", err));
    }, []);

    // Auto-close safety for modal if session expires while open
    useEffect(() => {
        const checkExpiry = () => {
            const start = new Date(session.startTime).getTime();
            const durationMs = session.duration * 60 * 60 * 1000;
            const end = start + durationMs;
            const now = Date.now();

            if (now > end + 30000) { // 30s grace
                onClose();
            }
        };
        const timer = setInterval(checkExpiry, 1000);
        return () => clearInterval(timer);
    }, [session, onClose]);

    const [newMember, setNewMember] = useState({
        name: "",
        peopleCount: 0,
        devices: { ps: [], pc: [], vr: [], wheel: [], metabat: [] } as DeviceMap
    });

    // Feature 3: Snacks (Dynamic)
    const [newSnackCost, setNewSnackCost] = useState(0);
    const [newSnackItems, setNewSnackItems] = useState<{ name: string; quantity: number }[]>([]);

    // ------------------- Calculations -------------------

    // Convert session.devices array ({ type, id }) to map for logic (Record<string, number[]>)
    const currentDeviceMap = session.devices.reduce((acc, dev) => {
        if (!acc[dev.type]) acc[dev.type] = [];
        if (dev.id) acc[dev.type].push(dev.id);
        return acc;
    }, {} as Record<string, number[]>);

    // MERGED map (current + new)
    const mergedDevices: Record<string, number[]> = { ...currentDeviceMap };

    // Ensure all keys exist
    ['ps', 'pc', 'vr', 'wheel', 'metabat'].forEach(k => {
        if (!mergedDevices[k]) mergedDevices[k] = [];
    });

    Object.keys(newMember.devices).forEach(k => {
        const key = k as keyof DeviceMap;
        const newDevs = newMember.devices[key];
        // Combine arrays
        mergedDevices[key] = [...(mergedDevices[key] || []), ...newDevs];
    });


    // 1. Calculate Old Price (Standard or Stored)
    // Actually we trust session.price.

    // 2. Calculate New Total Scenario
    /* =========================================================
    JOIN + EXTEND DELTA BILLING (CORRECT GAMING CAFE LOGIC)
    ========================================================= */

    // total people after adding members
    const addedPeople = newMember.peopleCount || 0;
    const totalPeople = (session.peopleCount || 1) + addedPeople;

    // duration after extension
    const newDuration = (session.duration || 0) + (extraMinutes / 60);

    /* ---------- STEP 1: REBUILD OLD PRICE WITH NEW PEOPLE ---------- */
    // What the total SHOULD have been if new players existed from start
    const recalculatedOldTotal = calculateSessionPrice(
        session.duration || 0,
        totalPeople,
        mergedDevices,
        new Date(session.startTime)
    );

    /* ---------- STEP 2: JOIN COST (Initial 30-min base charge) ---------- */
    const originalStoredTotal = session.price;
    let joinCost = 0;
    const hasNewConfig = (newMember.peopleCount || 0) > 0 || Object.values(newMember.devices).some((arr: number[]) => arr.length > 0);

    if (hasNewConfig) {
        // The user wants group pricing (delta between total old group and total new group) rather than individual per-person pricing
        // If the current session duration is more than half an hour (30 mins), charge according to the full user duration
        // If it is less than half an hour (30 mins), charge a minimum of half an hour (0.5 hrs)
        const joinDurationHrs = (session.duration || 0) > 30 ? (session.duration / 60) : 0.5;

        const baseNewConfig = calculateSessionPrice(joinDurationHrs, totalPeople, mergedDevices, new Date(session.startTime));
        const baseOldConfig = calculateSessionPrice(joinDurationHrs, session.peopleCount || 1, currentDeviceMap, new Date(session.startTime));

        joinCost = Math.max(0, baseNewConfig - baseOldConfig);
    }

    /* ---------- STEP 3: EXTENSION COST ---------- */
    const recalculatedNewTotal = calculateSessionPrice(
        newDuration,
        totalPeople,
        mergedDevices,
        new Date(session.startTime)
    );



    // Robustness: If remainingPeople is missing OR equals totalPeople despite payment, infer it
    let currentRemainingPeople = session.remainingPeople ?? totalPeople;

    // If DB says everyone is remaining, but we have paid amount, recalculate based on shares
    if ((session.remainingPeople === undefined || session.remainingPeople === totalPeople) && (session.paidAmount || 0) > 0) {
        // Estimate how many "full person shares" have been paid
        const baseShare = session.price / totalPeople;
        const peoplePaid = Math.floor((session.paidAmount || 0) / baseShare);
        currentRemainingPeople = Math.max(0, totalPeople - peoplePaid);
    }

    // CRITICAL FIX: Calculate charges for REMAINING PEOPLE only
    // People who already paid and left won't use the extra time!

    // Calculate the cost of EXTRA time for REMAINING people
    // CRITICAL: Use Delta Pricing to avoid re-triggering "First Hour" base costs

    const extraTimeCost = Math.max(0, recalculatedNewTotal - recalculatedOldTotal);
    // Total new charges = extra time for remaining people + snacks

    /* ---------- STEP 4: FINAL NEW CHARGES ---------- */
    const chargesAsString = joinCost + extraTimeCost + newSnackCost;

    /* ---------- TOTAL SESSION VALUE AFTER UPDATE ---------- */
    const totalToPay = originalStoredTotal + chargesAsString;

    // Track actual amounts paid, not just people count
    const currentRemainingAmount = session.remainingAmount ?? session.price;
    const alreadyPaidAmount = session.paidAmount || 0;

    // Removed unused newRemainingPeople calculation

    // CRITICAL FIX: Simplify share calculation
    // Instead of complex reconstruction, simply divide TOTAL PENDING by REMAINING PEOPLE.
    // This correctly handles saved sessions and partial payments.
    const totalPendingToPay = (session.remainingAmount ?? session.price) + chargesAsString;

    // Avoid division by zero
    const shareDivisor = currentRemainingPeople > 0 ? currentRemainingPeople : 1;

    // Each remaining person simply pays their share of the debt
    const perPersonShare = totalPendingToPay / shareDivisor;

    // Amount this payment will cover
    let payNowAmount = 0;

    if (paymentMode === 'equal') {
        payNowAmount = payingNow * perPersonShare;
    } else {
        payNowAmount = Math.min(Number(customPayAmount) || 0, totalPendingToPay);
    }

    const newRemainingAmount = Math.max(0, totalPendingToPay - payNowAmount);






    // ------------------- Handlers -------------------

    const updateDevice = (key: keyof DeviceMap, value: number[]) => {
        setNewMember(prev => ({
            ...prev,
            devices: { ...prev.devices, [key]: value }
        }));
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`https://thunder-management.onrender.com/api/sessions/delete/${session.id}`, {
                data: {
                    deletedBy: user?.role === 'owner' ? 'Owner' : 'Employee',
                    deletedByName: user?.username || 'Unknown'
                }
            });
            setShowDeleteConfirm(false);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to delete session");
        }
    };

    const handleConfirm = async () => {
        try {
            // Re-calculate payload values
            const extraHours = extraMinutes / 60;
            const charges = joinCost + extraTimeCost;
            // Extra time cost for remaining people only
            const memberCount = newMember.peopleCount;

            const payload = {
                extraTime: extraHours,
                extraPrice: charges + newSnackCost, // Extra time cost + snacks
                newMember: memberCount > 0 ? newMember : null,
                snacks: newSnackItems,
                paidNow: payNowAmount,
                payingPeopleNow: paymentMode === 'equal' ? payingNow : 1,
                paymentMode,
                // Add split counts to payload
                cashCount: paymentMethod === 'cash' ? payingNow : 0,
                onlineCount: paymentMethod === 'online' ? payingNow : 0
            };

            await axios.post(
                `https://thunder-management.onrender.com/api/sessions/update/${session.id}`,
                payload
            );

            onClose();
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    };



    return (
        <div className="modal-backdrop">
            <motion.div
                className="modal-container"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <FaClock size={14} />
                        </div>
                        <h2 className="modal-title">Update Session</h2>
                    </div>
                    <button className="close-icon-btn" onClick={onClose}>
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="content-wrapper custom-scrollbar" style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2.5rem', alignItems: 'start' }}>

                        {/* LEFT COLUMN: Adjustments */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            <section>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <FaClock style={{ display: 'inline', marginRight: '6px' }} /> Update Time
                                </h3>
                                <div className="minimal-counter">
                                    <button className="counter-btn" onClick={() => setExtraMinutes(prev => Math.max(0, prev - 15))}>
                                        <FaMinus size={12} />
                                    </button>
                                    <div className="counter-display">
                                        <div className="counter-value">{extraMinutes}</div>
                                        <span className="counter-label">Minutes Added</span>
                                    </div>
                                    <button className="counter-btn" onClick={() => setExtraMinutes(prev => prev + 15)}>
                                        <FaPlus size={12} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.01)' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Current Session Time</span>
                                    <span style={{ color: '#c084fc', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif' }}>
                                        {Math.floor(session.duration)}h {Math.round((session.duration % 1) * 60)}m
                                    </span>
                                </div>
                                {(() => {
                                    const start = new Date(session.startTime).getTime();
                                    const totalDurationMs = (session.duration + (extraMinutes / 60)) * 60 * 60 * 1000;
                                    const remaining = (start + totalDurationMs) - Date.now();

                                    let timeText = "Completed";
                                    if (remaining > 0) {
                                        const hrs = Math.floor(remaining / (1000 * 60 * 60));
                                        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                                        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
                                        timeText = `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
                                    }

                                    return (
                                        <div className={`timer-row ${extraMinutes > 0 ? 'updated' : ''}`}>
                                            <span className="timer-label">Next Update in</span>
                                            <span className={`timer-value ${remaining < 600000 ? 'urgent' : ''}`}>
                                                {timeText}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </section>

                            <section>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <FaUserPlus style={{ display: 'inline', marginRight: '6px' }} /> Players & Devices
                                </h3>
                                <div className="item-grid">
                                    <div className="input-group">
                                        <label className="input-label">New Player Name (Optional)</label>
                                        <input
                                            placeholder="e.g. Rahul Sharma"
                                            className="modal-input"
                                            value={newMember.name}
                                            onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="minimal-counter ">
                                        <button className="counter-btn" onClick={() => setNewMember(p => ({ ...p, peopleCount: Math.max(0, p.peopleCount - 1) }))}>
                                            <FaMinus size={12} />
                                        </button>
                                        <div className="counter-display">
                                            <div className="counter-value">{newMember.peopleCount}</div>
                                            <span className="counter-label">New Players</span>
                                        </div>
                                        <button className="counter-btn" onClick={() => setNewMember(p => ({ ...p, peopleCount: p.peopleCount + 1 }))}>
                                            <FaPlus size={12} />
                                        </button>
                                    </div>
                                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '1.5rem', marginBottom: '1rem' }}>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign Hardware</h4>
                                    </div>
                                    <div className="devices-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                        <DeviceDropdown icon={<FaGamepad />} label="PS5" limit={availability.limits.ps} value={newMember.devices.ps} occupied={availability.occupied.ps || []} onChange={v => updateDevice('ps', v)} />
                                        <DeviceDropdown icon={<FaDesktop />} label="PC" limit={availability.limits.pc} value={newMember.devices.pc} occupied={availability.occupied.pc || []} onChange={v => updateDevice('pc', v)} />
                                        <DeviceDropdown icon={<FaVrCardboard />} label="VR" limit={availability.limits.vr} value={newMember.devices.vr} occupied={availability.occupied.vr || []} onChange={v => updateDevice('vr', v)} />
                                        <DeviceDropdown icon={<GiSteeringWheel />} label="Wheel" limit={availability.limits.wheel} value={newMember.devices.wheel} occupied={availability.occupied.wheel || []} onChange={v => updateDevice('wheel', v)} />
                                        <DeviceDropdown icon={<GiCricketBat />} label="MetaBat" limit={availability.limits.metabat} value={newMember.devices.metabat} occupied={availability.occupied.metabat || []} onChange={v => updateDevice('metabat', v)} />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <FaPizzaSlice style={{ display: 'inline', marginRight: '6px' }} /> Add Snacks
                                </h3>
                                <SnackSelector
                                    onChange={(_, cost, items) => {
                                        setNewSnackCost(cost);
                                        setNewSnackItems(items.map(i => ({ name: i.name, quantity: i.qty })));
                                    }}
                                />
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Invoice */}
                        <div style={{ position: 'sticky', top: '0', height: 'fit-content' }}>
                            <div className="invoice-card" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                                <div className="invoice-header">
                                    <div className="invoice-title">Total Session Cost</div>
                                    <div className="invoice-total-display">
                                        ₹{(session.price + chargesAsString).toFixed(0)}
                                    </div>
                                    <div className="invoice-subtitle">
                                        Old Price: ₹{session.price} + New Charges: ₹{chargesAsString}
                                    </div>
                                </div>

                                <div className="invoice-row">
                                    <span className="invoice-label">Total People</span>
                                    <span className="invoice-val">{totalPeople}</span>
                                </div>

                                <div className="invoice-row">
                                    <span className="invoice-label">Per Person Share</span>
                                    <span className="invoice-val">₹{perPersonShare.toFixed(0)}</span>
                                </div>

                                <div className="invoice-row" style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                    <span className="invoice-label">Already Paid</span>
                                    <span className="invoice-val" style={{ color: '#4ade80' }}>₹{alreadyPaidAmount.toFixed(0)}</span>
                                </div>

                                <div className="invoice-row">
                                    <span className="invoice-label">Current Pending</span>
                                    <span className="invoice-val">₹{currentRemainingAmount.toFixed(0)}</span>
                                </div>

                                <div className="invoice-row" style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem' }}>
                                    <span className="invoice-label">Payment Type</span>
                                    <select
                                        className="modal-input"
                                        style={{ width: '160px', padding: '0.5rem 0.8rem', textAlign: 'left' }}
                                        value={paymentMode}
                                        onChange={e => setPaymentMode(e.target.value as any)}
                                    >
                                        <option value="equal">Equal Split</option>
                                        <option value="custom">Custom Amount</option>
                                    </select>
                                </div>

                                {paymentMode === 'equal' && (
                                    <div className="invoice-row" style={{ marginTop: '10px' }}>
                                        <span className="invoice-label">People Paying Now</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => setPayingNowCount(p => Math.max(0, p - 1))}
                                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', background: 'var(--modal-surface-hover)' }}
                                            >
                                                <FaMinus size={10} />
                                            </button>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>
                                                {payingNowCount}
                                            </span>
                                            <button
                                                onClick={() => setPayingNowCount(p => Math.min(currentRemainingPeople + (newMember.peopleCount || 0), p + 1))}
                                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', background: 'var(--modal-surface-hover)' }}
                                            >
                                                <FaPlus size={10} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="invoice-row" style={{ marginTop: '10px', alignItems: 'flex-start' }}>
                                    <span className="invoice-label" style={{ marginTop: '8px' }}>Payment Method</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setPaymentMethod('cash')}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                                                background: paymentMethod === 'cash' ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                                                border: `1px solid ${paymentMethod === 'cash' ? 'rgba(74, 222, 128, 0.5)' : 'var(--border-subtle)'}`,
                                                color: paymentMethod === 'cash' ? '#4ade80' : 'var(--text-secondary)',
                                                transition: 'all 0.2s', cursor: 'pointer'
                                            }}
                                        >
                                            Cash
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('online')}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                                                background: paymentMethod === 'online' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                border: `1px solid ${paymentMethod === 'online' ? 'rgba(59, 130, 246, 0.5)' : 'var(--border-subtle)'}`,
                                                color: paymentMethod === 'online' ? '#60a5fa' : 'var(--text-secondary)',
                                                transition: 'all 0.2s', cursor: 'pointer'
                                            }}
                                        >
                                            Online
                                        </button>
                                    </div>
                                </div>

                                {paymentMode === 'custom' && (
                                    <div className="invoice-row" style={{ marginTop: '10px' }}>
                                        <span className="invoice-label">Enter Amount</span>
                                        <input
                                            type="text"
                                            className="invoice-field"
                                            placeholder="0"
                                            value={customPayAmount}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                setCustomPayAmount(val ? Number(val) : '');
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="invoice-row" style={{ marginTop: '10px' }}>
                                    <span className="invoice-label">Pay Now Amount</span>
                                    <span className="invoice-val" style={{ color: 'var(--accent-primary)' }}>
                                        ₹{payNowAmount.toFixed(0)}
                                    </span>
                                </div>

                                <div className="invoice-row" style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                    <span className="invoice-label">New Pending Balance</span>
                                    <span className="invoice-val" style={{ fontWeight: 'bold', color: newRemainingAmount === 0 ? '#4ade80' : 'inherit' }}>
                                        ₹{newRemainingAmount.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="action-bar">
                    <button
                        className="delete-btn"
                        onClick={handleDelete}
                        title="Delete Session"
                    >
                        <FaTrash />
                    </button>

                    <div className="total-section" style={{ marginLeft: 'auto', marginRight: '1rem', textAlign: 'right' }}>
                        <span className="total-label-sm">Balance After Pay</span>
                        <motion.span
                            key={totalToPay}
                            initial={{ scale: 1.2, color: '#fff' }}
                            animate={{ scale: 1, color: '#f4f4f5' }}
                            className="total-value-lg"
                        >
                            ₹{newRemainingAmount.toFixed(0)}
                        </motion.span>
                    </div>
                    <button className="pay-btn" onClick={handleConfirm}>
                        Confirm <FaChevronRight size={12} />
                    </button>
                </div>

            </motion.div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Session?"
                message={`Are you sure you want to delete this session for ${session.customer}? This action cannot be undone.`}
                isDanger={true}
            />
        </div>
    );
};

export default UpdateSessionModal;