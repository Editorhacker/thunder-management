
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaDesktop, FaGamepad, FaClock, FaUserPlus, FaPizzaSlice, FaMinus, FaPlus, FaChevronRight, FaTrash } from "react-icons/fa";
import "./UpdateSessionModal.css";
import SnackSelector from './SnackSelector';
import DeviceDropdown from './DeviceDropdown';
import { calculateSessionPrice } from '../../utils/pricing';

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

const TabButton = ({
    // id,
    label,
    icon: Icon,
    isActive,
    onClick
}: {
    id: string,
    label: string,
    icon: any,
    isActive: boolean,
    onClick: () => void
}) => (
    <button
        className={`segment-btn ${isActive ? 'active' : ''}`}
        onClick={onClick}
    >
        {isActive && (
            <motion.div
                layoutId="segment-indicator"
                className="absolute inset-0 bg-white/10 rounded-lg shadow-sm"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        )}
        <span className="relative z-10 flex items-center gap-2">
            <Icon /> {label}
        </span>
    </button>
);

const UpdateSessionModal = ({ session, onClose }: Props) => {
    // ------------------- State -------------------
    const [activeTab, setActiveTab] = useState<'extend' | 'addMember' | 'snacks' | 'split'>('extend');

    // Replaced single payingNow state with specific counts
    const [cashCount, setCashCount] = useState(0);
    const [onlineCount, setOnlineCount] = useState(0);

    // Derived total people paying now
    const payingNow = cashCount + onlineCount;

    const [customPayAmount, setCustomPayAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState<'equal' | 'custom'>('equal');


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
        // If id is null (legacy), we can't really represent it in number[], but pricing mostly cares about count or array length
        // Note: frontend calculateSessionPrice normally expects number[] to determine count.
        // If legacy data has no ID, we might need a workaround if pricing depends on specific IDs?
        // Actually, pricing just uses .length usually. So we can push dummy values if needed, but let's assume valid IDs for now.
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

    /* ---------- STEP 2: JOIN COST (retroactive billing) ---------- */
    const originalStoredTotal = session.price;
    const joinCost = Math.max(0, recalculatedOldTotal - originalStoredTotal);

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
    // const priceWithTotalTime = calculateSessionPrice(
    //     newDuration,
    //     currentRemainingPeople,
    //     mergedDevices,
    //     new Date()
    // );

    // const priceWithOriginalTime = calculateSessionPrice(
    //     session.duration || 0,
    //     currentRemainingPeople,
    //     mergedDevices,
    //     new Date()
    // );


    const extraTimeCost = Math.max(0, recalculatedNewTotal - recalculatedOldTotal);
    // Total new charges = extra time for remaining people + snacks

    /* ---------- STEP 4: FINAL NEW CHARGES ---------- */
    const chargesAsString = joinCost + extraTimeCost + newSnackCost;

    // CRITICAL: finalBill should be the TOTAL bill (session.price + new charges)
    // const finalBill = session.price + chargesAsString;


    /* ---------- TOTAL SESSION VALUE AFTER UPDATE ---------- */
    const totalToPay = originalStoredTotal + chargesAsString;

    // Track actual amounts paid, not just people count
    const currentRemainingAmount = session.remainingAmount ?? session.price;
    const alreadyPaidAmount = session.paidAmount || 0;

    // Calculate new remaining people (subtract those paying, add new members)
    const newRemainingPeople = Math.max(0, currentRemainingPeople - payingNow + (newMember.peopleCount || 0));

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
        payNowAmount = Math.min(customPayAmount, totalPendingToPay);
    }

    const newRemainingAmount = Math.max(0, totalPendingToPay - payNowAmount);

    const newRemainingPeopleAfterPay =
        paymentMode === 'equal'
            ? Math.max(0, currentRemainingPeople - payingNow)
            : Math.max(1, currentRemainingPeople - 1); // birthday guy leaves

    const newPerPersonShare =
        newRemainingPeopleAfterPay > 0
            ? newRemainingAmount / newRemainingPeopleAfterPay
            : 0;


    // ------------------- Handlers -------------------

    const updateDevice = (key: keyof DeviceMap, value: number[]) => {
        setNewMember(prev => ({
            ...prev,
            devices: { ...prev.devices, [key]: value }
        }));
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this session? This cannot be undone.")) return;

        try {
            await axios.delete(`https://thunder-management.onrender.com/api/sessions/delete/${session.id}`);
            alert("Session deleted successfully");
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
                cashCount,
                onlineCount
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
                    <h2 className="modal-title">Update Session</h2>
                    <button className="close-icon-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* Tabs */}
                <div className="segmented-control">
                    <TabButton
                        id="extend"
                        label="Time"
                        icon={FaClock}
                        isActive={activeTab === 'extend'}
                        onClick={() => setActiveTab('extend')}
                    />
                    <TabButton
                        id="addMember"
                        label="People"
                        icon={FaUserPlus}
                        isActive={activeTab === 'addMember'}
                        onClick={() => setActiveTab('addMember')}
                    />
                    <TabButton
                        id="snacks"
                        label="Snacks"
                        icon={FaPizzaSlice}
                        isActive={activeTab === 'snacks'}
                        onClick={() => setActiveTab('snacks')}
                    />
                    <TabButton
                        id="split"
                        label="Split"
                        icon={FaUserPlus}
                        isActive={activeTab === 'split'}
                        onClick={() => setActiveTab('split')}
                    />

                </div>

                {/* Content */}
                <div className="content-wrapper custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'extend' && (
                            <motion.div
                                key="extend"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="minimal-counter">
                                    <button className="counter-btn" onClick={() => setExtraMinutes(prev => Math.max(15, prev - 15))}>
                                        <FaMinus size={12} />
                                    </button>
                                    <div className="counter-display">
                                        <div className="counter-value">{extraMinutes}</div>
                                        <span className="counter-label">minutes added</span>
                                    </div>
                                    <button className="counter-btn" onClick={() => setExtraMinutes(prev => prev + 15)}>
                                        <FaPlus size={12} />
                                    </button>
                                </div>

                                <div className="text-sm text-gray-400 text-center">
                                    Current Session Time: {Math.floor(session.duration / 60)}h {session.duration % 60}m
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'addMember' && (
                            <motion.div
                                key="members"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="item-grid"
                            >
                                <input
                                    placeholder=" New Player Name"
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors mb-4"
                                    value={newMember.name}
                                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                />

                                <div className="minimal-counter ">
                                    <button className="counter-btn" onClick={() => setNewMember(p => ({ ...p, peopleCount: Math.max(0, p.peopleCount - 1) }))}>
                                        <FaMinus size={12} />
                                    </button>
                                    <div className="counter-display">
                                        <div className="counter-value">{newMember.peopleCount}</div>
                                        <span className="counter-label">new players</span>
                                    </div>
                                    <button className="counter-btn" onClick={() => setNewMember(p => ({ ...p, peopleCount: p.peopleCount + 1 }))}>
                                        <FaPlus size={12} />
                                    </button>
                                </div>

                                <h4 className="text-xs font-bold text-gray-500 uppercase mt-4 mb-2">Assign Devices</h4>
                                <div className="devices-list" style={{ display: 'grid', gap: '0.75rem' }}>
                                    <DeviceDropdown
                                        icon={<FaGamepad />}
                                        label="PS5"
                                        limit={availability.limits.ps}
                                        value={newMember.devices.ps}
                                        occupied={availability.occupied.ps || []}
                                        onChange={v => updateDevice('ps', v)}
                                    />
                                    <DeviceDropdown
                                        icon={<FaDesktop />}
                                        label="PC"
                                        limit={availability.limits.pc}
                                        value={newMember.devices.pc}
                                        occupied={availability.occupied.pc || []}
                                        onChange={v => updateDevice('pc', v)}
                                    />
                                    <DeviceDropdown
                                        icon={<FaUserPlus />} // VR Icon placeholder
                                        label="VR"
                                        limit={availability.limits.vr}
                                        value={newMember.devices.vr}
                                        occupied={availability.occupied.vr || []}
                                        onChange={v => updateDevice('vr', v)}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'snacks' && (
                            <motion.div
                                key="snacks"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="item-grid"
                                style={{ display: 'block' }} // Allow block layout for selector
                            >
                                <SnackSelector
                                    onChange={(_, cost, items) => {
                                        setNewSnackCost(cost);
                                        setNewSnackItems(items.map(i => ({ name: i.name, quantity: i.qty })));
                                    }}
                                />
                            </motion.div>
                        )}
                        {activeTab === 'split' && (
                            <motion.div>
                                <div className="invoice-card">
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
                                        <span className="invoice-val">₹{currentRemainingAmount.toFixed(0)}
                                        </span>
                                    </div>

                                    <div className="invoice-row" style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem' }}>
                                        <span className="invoice-label">Payment Type</span>
                                        <select
                                            className="invoice-field"
                                            value={paymentMode}
                                            onChange={e => setPaymentMode(e.target.value as any)}
                                        >
                                            <option value="equal">Equal Split</option>
                                            <option value="custom">Custom Amount</option>
                                        </select>
                                    </div>

                                    {paymentMode === 'equal' && (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '12px',
                                            marginTop: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{
                                                background: 'rgba(74, 222, 128, 0.05)',
                                                border: '1px solid rgba(74, 222, 128, 0.1)',
                                                padding: '12px',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4ade80', marginBottom: '8px', textTransform: 'uppercase' }}>CASH Payers</div>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={newRemainingPeople}
                                                    value={cashCount}
                                                    onChange={e => {
                                                        const val = Math.max(0, Number(e.target.value));
                                                        setCashCount(val);
                                                        // Ensure logical consistency if needed, but allowing free input is often easier
                                                    }}
                                                    className="invoice-field"
                                                    style={{ width: '100%', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                                                />
                                            </div>
                                            <div style={{
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                                padding: '12px',
                                                borderRadius: '12px'
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#60a5fa', marginBottom: '8px', textTransform: 'uppercase' }}>ONLINE Payers</div>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={newRemainingPeople}
                                                    value={onlineCount}
                                                    onChange={e => {
                                                        const val = Math.max(0, Number(e.target.value));
                                                        setOnlineCount(val);
                                                    }}
                                                    className="invoice-field"
                                                    style={{ width: '100%', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {paymentMode === 'custom' && (
                                        <div className="invoice-row" style={{ marginTop: '10px' }}>
                                            <span className="invoice-label">Enter Amount</span>
                                            <input
                                                type="number"
                                                className="invoice-field"
                                                value={customPayAmount}
                                                onChange={e => setCustomPayAmount(Number(e.target.value))}
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
                            </motion.div>
                        )}

                    </AnimatePresence>
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
        </div>
    );
};

export default UpdateSessionModal;