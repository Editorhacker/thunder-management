import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePricing } from '../context/PricingContext';
import { defaultPricingConfig } from '../types/pricingConfig';
import type { PricingConfig } from '../types/pricingConfig';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdSave,
    MdCheckCircle,
    MdAccessTime,
    MdFlashOn,
    MdShield,
    MdVideogameAsset,
    MdComputer,
    MdSettingsInputComponent,
    MdInfo,
    MdTune,
    MdRefresh,
    MdKeyboardArrowRight,
    MdEventAvailable
} from 'react-icons/md';
import './PricingConfig.css';

const URL = import.meta.env.VITE_BACKEND_URL || 'https://thunder-management.onrender.com';

type TabType = 'hours' | 'consoles' | 'specialized';

const PricingConfigPage = () => {
    const { refreshConfig } = usePricing();
    const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('hours');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${URL}/api/pricing`);
            if (response.data) {
                setConfig(response.data);
            }
        } catch (err) {
            console.error("Error fetching admin pricing config", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section: keyof PricingConfig, field: string, value: any) => {
        setConfig(prev => {
            const updatedSection = { ...prev[section] as any };

            if (field.includes('.')) {
                const [top, bottom] = field.split('.');
                updatedSection[top] = { ...updatedSection[top], [bottom]: value };
            } else {
                updatedSection[field] = value;
            }

            return {
                ...prev,
                [section]: updatedSection
            };
        });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        try {
            await axios.put(`${URL}/api/pricing`, config);
            refreshConfig();
            setSuccessMessage("Configuration Synced Successfully");
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            console.error(error);
            alert("Failed to save pricing configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="pricing-dashboard-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ fontSize: '3rem', color: '#3b82f6' }}
                >
                    <MdTune />
                </motion.div>
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Establishing secure connection...</p>
            </div>
        );
    }

    const TimePicker = ({ hour, minute, onChange, hasMinute = true }: { hour: number; minute?: number; onChange: (h: number, m?: number) => void; hasMinute?: boolean }) => (
        <div className="time-box-premium">
            <input
                type="number"
                value={hour}
                onChange={e => onChange(Math.min(23, Math.max(0, Number(e.target.value))), minute)}
                className="time-num-input"
            />
            {hasMinute && (
                <>
                    <span className="time-sep">:</span>
                    <input
                        type="number"
                        value={minute}
                        onChange={e => onChange(hour, Math.min(59, Math.max(0, Number(e.target.value))))}
                        className="time-num-input"
                    />
                </>
            )}
        </div>
    );

    const renderHoursTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="helper-box">
                <MdInfo className="helper-icon" />
                <div className="helper-text">
                    The pricing engine automatically transitions between slots. Ensure <strong>End Time</strong> of one slot roughly aligns with the <strong>Start Time</strong> of the next.
                </div>
            </div>

            <div className="schedule-container">
                {/* WEEKDAY SECTION */}
                <div className="day-schedule-card">
                    <div className="day-header-dash">
                        <MdEventAvailable size={24} style={{ color: '#3b82f6' }} />
                        <h3>Weekdays <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Mon — Fri</span></h3>
                    </div>

                    <div className="shifts-timeline">
                        <div className="shift-row shift-happy">
                            <div className="shift-label"><MdFlashOn /> Happy Hour</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.happyHour.weekdayStartHour} minute={config.happyHour.weekdayStartMinute} onChange={(h, m) => { handleChange('happyHour', 'weekdayStartHour', h); handleChange('happyHour', 'weekdayStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.happyHour.weekdayEndHour} minute={config.happyHour.weekdayEndMinute} onChange={(h, m) => { handleChange('happyHour', 'weekdayEndHour', h); handleChange('happyHour', 'weekdayEndMinute', m); }} />
                            </div>
                        </div>

                        <div className="shift-row shift-normal">
                            <div className="shift-label"><MdAccessTime /> Normal</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.normalHour.weekdayStartHour} minute={config.normalHour.weekdayStartMinute} onChange={(h, m) => { handleChange('normalHour', 'weekdayStartHour', h); handleChange('normalHour', 'weekdayStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.normalHour.weekdayEndHour} minute={config.normalHour.weekdayEndMinute} onChange={(h, m) => { handleChange('normalHour', 'weekdayEndHour', h); handleChange('normalHour', 'weekdayEndMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* WEEKEND SECTION */}
                <div className="day-schedule-card" style={{ borderLeftColor: '#facc15' }}>
                    <div className="day-header-dash">
                        <MdEventAvailable size={24} style={{ color: '#facc15' }} />
                        <h3>Weekends <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Sat — Sun</span></h3>
                    </div>

                    <div className="shifts-timeline">
                        <div className="shift-row shift-happy">
                            <div className="shift-label"><MdFlashOn /> Happy Hour</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.happyHour.weekendStartHour} minute={config.happyHour.weekendStartMinute} onChange={(h, m) => { handleChange('happyHour', 'weekendStartHour', h); handleChange('happyHour', 'weekendStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.happyHour.weekendEndHour} minute={config.happyHour.weekendEndMinute} onChange={(h, m) => { handleChange('happyHour', 'weekendEndHour', h); handleChange('happyHour', 'weekendEndMinute', m); }} />
                            </div>
                        </div>

                        <div className="shift-row shift-normal">
                            <div className="shift-label"><MdAccessTime /> Normal</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.normalHour.weekendStartHour} minute={config.normalHour.weekendStartMinute} onChange={(h, m) => { handleChange('normalHour', 'weekendStartHour', h); handleChange('normalHour', 'weekendStartMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.normalHour.weekendEndHour} minute={config.normalHour.weekendEndMinute} onChange={(h, m) => { handleChange('normalHour', 'weekendEndHour', h); handleChange('normalHour', 'weekendEndMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LATE NIGHT */}
                <div className="day-schedule-card" style={{ borderLeftColor: '#ec4899' }}>
                    <div className="day-header-dash">
                        <MdShield size={24} style={{ color: '#ec4899' }} />
                        <h3>Shift Policy <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', marginLeft: '8px' }}>Daily Rotation</span></h3>
                    </div>
                    <div className="shifts-timeline">
                        <div className="shift-row shift-fun">
                            <div className="shift-label"><MdShield /> Fun Night</div>
                            <div className="shift-controls">
                                <TimePicker hour={config.funNight.startHour} minute={config.funNight.startMinute} onChange={(h, m) => { handleChange('funNight', 'startHour', h); handleChange('funNight', 'startMinute', m); }} />
                                <MdKeyboardArrowRight className="shift-arrow-icon" />
                                <TimePicker hour={config.funNight.endHour} minute={config.funNight.endMinute} onChange={(h, m) => { handleChange('funNight', 'endHour', h); handleChange('funNight', 'endMinute', m); }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderConsolesTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="settings-group">
                <div className="settings-group-header">
                    <MdSettingsInputComponent style={{ color: '#3b82f6' }} /> Console & PC Rate Matrix
                </div>
                <table className="price-comparison-table">
                    <thead>
                        <tr>
                            <th style={{ width: '220px' }}>Platform Device</th>
                            <th>Max 30m</th>
                            <th>Base (60m)</th>
                            <th>Multi-Mod</th>
                            <th>Extra Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#facc15' }} /> PS5 (Happy Hour)</div></td>
                            <td><input type="number" value={config.happyHourPrices.ps5.less30m} onChange={e => handleChange('happyHourPrices', 'ps5.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.happyHourPrices.ps5.onePersonBase} onChange={e => handleChange('happyHourPrices', 'ps5.onePersonBase', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.happyHourPrices.ps5.multiplePersonBaseMod} onChange={e => handleChange('happyHourPrices', 'ps5.multiplePersonBaseMod', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.happyHourPrices.ps5.extra30mMod} onChange={e => handleChange('happyHourPrices', 'ps5.extra30mMod', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#60a5fa' }} /> PS5 (Normal)</div></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.normalHourPrices.ps5.onePerson} onChange={e => handleChange('normalHourPrices', 'ps5.onePerson', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.normalHourPrices.ps5.multiplePersonBaseMod} onChange={e => handleChange('normalHourPrices', 'ps5.multiplePersonBaseMod', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.normalHourPrices.ps5.extra30mMod} onChange={e => handleChange('normalHourPrices', 'ps5.extra30mMod', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#ec4899' }} /> PS5 (Fun Night)</div></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.funNightPrices.ps5.onePerson} onChange={e => handleChange('funNightPrices', 'ps5.onePerson', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.funNightPrices.ps5.multiplePersonBaseMod} onChange={e => handleChange('funNightPrices', 'ps5.multiplePersonBaseMod', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.funNightPrices.ps5.extra30mMod} onChange={e => handleChange('funNightPrices', 'ps5.extra30mMod', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>

                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdComputer style={{ color: '#facc15' }} /> PC (Happy Hour)</div></td>
                            <td><input type="number" value={config.happyHourPrices.pc.less30m} onChange={e => handleChange('happyHourPrices', 'pc.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.happyHourPrices.pc.base} onChange={e => handleChange('happyHourPrices', 'pc.base', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.happyHourPrices.pc.extra30m} onChange={e => handleChange('happyHourPrices', 'pc.extra30m', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdComputer style={{ color: '#60a5fa' }} /> PC (Normal)</div></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.normalHourPrices.pc.base} onChange={e => handleChange('normalHourPrices', 'pc.base', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.normalHourPrices.pc.extra30m} onChange={e => handleChange('normalHourPrices', 'pc.extra30m', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdComputer style={{ color: '#ec4899' }} /> PC (Fun Night)</div></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.funNightPrices.pc.base} onChange={e => handleChange('funNightPrices', 'pc.base', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.funNightPrices.pc.extra30m} onChange={e => handleChange('funNightPrices', 'pc.extra30m', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>

                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#facc15' }} /> Wheel (Happy Hour)</div></td>
                            <td><input type="number" value={config.happyHourPrices.wheel.less30m} onChange={e => handleChange('happyHourPrices', 'wheel.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.happyHourPrices.wheel.base} onChange={e => handleChange('happyHourPrices', 'wheel.base', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.happyHourPrices.wheel.extra60m} onChange={e => handleChange('happyHourPrices', 'wheel.extra60m', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#60a5fa' }} /> Wheel (Normal)</div></td>
                            <td><input type="number" value={config.normalHourPrices.wheel.less30m} onChange={e => handleChange('normalHourPrices', 'wheel.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.normalHourPrices.wheel.base} onChange={e => handleChange('normalHourPrices', 'wheel.base', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.normalHourPrices.wheel.extra30m} onChange={e => handleChange('normalHourPrices', 'wheel.extra30m', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                        <tr className="price-row-card">
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MdSettingsInputComponent style={{ color: '#ec4899' }} /> Wheel (Fun Night)</div></td>
                            <td><input type="number" value={config.funNightPrices.wheel.less30m} onChange={e => handleChange('funNightPrices', 'wheel.less30m', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><input type="number" value={config.funNightPrices.wheel.base} onChange={e => handleChange('funNightPrices', 'wheel.base', Number(e.target.value))} className="dashboard-input" /></td>
                            <td><span className="unit-label">N/A</span></td>
                            <td><input type="number" value={config.funNightPrices.wheel.extra30m} onChange={e => handleChange('funNightPrices', 'wheel.extra30m', Number(e.target.value))} className="dashboard-input" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );

    const renderSpecializedTab = () => (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <div className="settings-group">
                <div className="settings-group-header">
                    <MdVideogameAsset style={{ color: '#a78bfa' }} /> VR & Specialized Units
                </div>
                <div className="settings-grid">
                    <div className="setting-input-card">
                        <label className="setting-label">Base Hourly Rate</label>
                        <div className="setting-value-wrap">
                            <span className="unit-label">₹</span>
                            <input type="number" value={config.vr.hour} onChange={e => handleChange('vr', 'hour', Number(e.target.value))} className="dashboard-input" />
                        </div>
                    </div>
                    <div className="setting-input-card">
                        <label className="setting-label">Initial Unit (15m)</label>
                        <div className="setting-value-wrap">
                            <span className="unit-label">₹</span>
                            <input type="number" value={config.vr.first15m} onChange={e => handleChange('vr', 'first15m', Number(e.target.value))} className="dashboard-input" />
                        </div>
                    </div>
                    <div className="setting-input-card">
                        <label className="setting-label">Half Cycle (30m)</label>
                        <div className="setting-value-wrap">
                            <span className="unit-label">₹</span>
                            <input type="number" value={config.vr.first30m} onChange={e => handleChange('vr', 'first30m', Number(e.target.value))} className="dashboard-input" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="pricing-dashboard-view">
            <AnimatePresence mode="wait">
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="success-toast"
                        style={{ position: 'fixed', top: '1.5rem', right: '1.5rem' }}
                    >
                        <MdCheckCircle size={20} />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="module-header">
                <div className="module-title">
                    <h2>Pricing Engine Configuration</h2>
                    <p>Centralized control for system economy and time-based multipliers.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-secondary"
                        onClick={fetchConfig}
                        style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <MdRefresh /> Reload Data
                    </motion.button>
                </div>
            </header>

            <div className="pricing-tabs-container">
                <nav className="pricing-tabs-nav">
                    <button className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>
                        <MdAccessTime className="tab-icon" /> Operating Hours
                    </button>
                    <button className={`tab-btn ${activeTab === 'consoles' ? 'active' : ''}`} onClick={() => setActiveTab('consoles')}>
                        <MdSettingsInputComponent className="tab-icon" /> Rate Matrix
                    </button>
                    <button className={`tab-btn ${activeTab === 'specialized' ? 'active' : ''}`} onClick={() => setActiveTab('specialized')}>
                        <MdVideogameAsset className="tab-icon" /> Specialized Units
                    </button>
                </nav>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <main className="pricing-tabs-content">
                        {activeTab === 'hours' && renderHoursTab()}
                        {activeTab === 'consoles' && renderConsolesTab()}
                        {activeTab === 'specialized' && renderSpecializedTab()}
                    </main>

                    <footer className="module-actions-bar">
                        <button className="btn-secondary" onClick={fetchConfig}>Discard Changes</button>
                        <motion.button
                            className="btn-primary"
                            disabled={saving}
                            onClick={() => handleSave()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {saving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                    <MdRefresh size={18} />
                                </motion.div>
                            ) : <MdSave size={18} />}
                            {saving ? 'Syncing...' : 'Save Configuration'}
                        </motion.button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default PricingConfigPage;
