import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePricing } from '../context/PricingContext';
import { defaultPricingConfig } from '../types/pricingConfig';
import type { PricingConfig } from '../types/pricingConfig';

const URL = import.meta.env.VITE_BACKEND_URL || 'https://thunder-management.onrender.com';

const PricingConfigPage = () => {
    const { refreshConfig } = usePricing();
    const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
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
        fetchConfig();
    }, []);

    const handleChange = (section: keyof PricingConfig, field: string, value: any) => {
        // Simple nested update, assumes at most 2 levels deep
        setConfig(prev => {
            const updatedSection = { ...prev[section] as any };

            // Handle multiple-level nesting if field has a dot
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        try {
            await axios.put(`${URL}/api/pricing`, config);
            refreshConfig();
            setSuccessMessage("Pricing configuration updated successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error(error);
            alert("Failed to save pricing configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-white">Loading configuration...</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Dynamic Pricing Configuration</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Configure times and prices for all devices. These changes take effect immediately for new sessions and extensions.</p>

            {successMessage && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(34, 197, 94, 0.5)' }}>
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* TIMING CONFIGURATION */}
                <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#38bdf8' }}>🕰️ Time Ranges Settings</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#facc15' }}>Happy Hour (Weekday)</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    Start Hour: <input type="number" min="0" max="23" value={config.happyHour.weekdayStartHour} onChange={e => handleChange('happyHour', 'weekdayStartHour', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End Hour: <input type="number" min="0" max="23" value={config.happyHour.weekdayEndHour} onChange={e => handleChange('happyHour', 'weekdayEndHour', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End Minute: <input type="number" min="0" max="59" value={config.happyHour.weekdayEndMinute} onChange={e => handleChange('happyHour', 'weekdayEndMinute', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#facc15' }}>Happy Hour (Weekend)</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    Start Hour: <input type="number" min="0" max="23" value={config.happyHour.weekendStartHour} onChange={e => handleChange('happyHour', 'weekendStartHour', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End Hour: <input type="number" min="0" max="23" value={config.happyHour.weekendEndHour} onChange={e => handleChange('happyHour', 'weekendEndHour', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End Minute: <input type="number" min="0" max="59" value={config.happyHour.weekendEndMinute} onChange={e => handleChange('happyHour', 'weekendEndMinute', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Normal Hour (Weekday)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    Start:
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" min="0" max="23" value={config.normalHour.weekdayStartHour} onChange={e => handleChange('normalHour', 'weekdayStartHour', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> h
                                        <input type="number" min="0" max="59" value={config.normalHour.weekdayStartMinute} onChange={e => handleChange('normalHour', 'weekdayStartMinute', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> m
                                    </div>
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End:
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" min="0" max="23" value={config.normalHour.weekdayEndHour} onChange={e => handleChange('normalHour', 'weekdayEndHour', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> h
                                        <input type="number" min="0" max="59" value={config.normalHour.weekdayEndMinute} onChange={e => handleChange('normalHour', 'weekdayEndMinute', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> m
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Normal Hour (Weekend)</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    Start:
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" min="0" max="23" value={config.normalHour.weekendStartHour} onChange={e => handleChange('normalHour', 'weekendStartHour', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> h
                                        <input type="number" min="0" max="59" value={config.normalHour.weekendStartMinute} onChange={e => handleChange('normalHour', 'weekendStartMinute', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> m
                                    </div>
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End:
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" min="0" max="23" value={config.normalHour.weekendEndHour} onChange={e => handleChange('normalHour', 'weekendEndHour', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> h
                                        <input type="number" min="0" max="59" value={config.normalHour.weekendEndMinute} onChange={e => handleChange('normalHour', 'weekendEndMinute', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> m
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#ec4899' }}>Fun Night</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    Start:
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" min="0" max="23" value={config.funNight.startHour} onChange={e => handleChange('funNight', 'startHour', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> h
                                        <input type="number" min="0" max="59" value={config.funNight.startMinute} onChange={e => handleChange('funNight', 'startMinute', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> m
                                    </div>
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    End:
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input type="number" min="0" max="23" value={config.funNight.endHour} onChange={e => handleChange('funNight', 'endHour', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> h
                                        <input type="number" min="0" max="59" value={config.funNight.endMinute} onChange={e => handleChange('funNight', 'endMinute', Number(e.target.value))} style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} /> m
                                    </div>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>

                {/* DEVICE PRICES CONFIGURATION */}
                <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#4ade80' }}>🎮 Device & Pricing Settings</h2>

                    {/* VR BASE */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#a78bfa' }}>VR & MetaBat Rules</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                1 Hour Price:
                                <input type="number" value={config.vr.hour} onChange={e => handleChange('vr', 'hour', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                0-15m Price:
                                <input type="number" value={config.vr.first15m} onChange={e => handleChange('vr', 'first15m', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                15-30m Price:
                                <input type="number" value={config.vr.first30m} onChange={e => handleChange('vr', 'first30m', Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '1rem' }}>

                        {/* HAPPY HOUR PRICES */}
                        <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #166534' }}>
                            <h4 style={{ color: '#facc15', marginBottom: '1rem', fontSize: '1.1rem' }}>Happy Hour Prices</h4>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>PS5</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>&lt;= 30m: <input type="number" value={config.happyHourPrices.ps5.less30m} onChange={e => handleChange('happyHourPrices', 'ps5.less30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>1 Person (Base): <input type="number" value={config.happyHourPrices.ps5.onePersonBase} onChange={e => handleChange('happyHourPrices', 'ps5.onePersonBase', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Multi Person Mod: <input type="number" value={config.happyHourPrices.ps5.multiplePersonBaseMod} onChange={e => handleChange('happyHourPrices', 'ps5.multiplePersonBaseMod', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m Mod: <input type="number" value={config.happyHourPrices.ps5.extra30mMod} onChange={e => handleChange('happyHourPrices', 'ps5.extra30mMod', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>PC</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>&lt;= 30m: <input type="number" value={config.happyHourPrices.pc.less30m} onChange={e => handleChange('happyHourPrices', 'pc.less30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Base (60m): <input type="number" value={config.happyHourPrices.pc.base} onChange={e => handleChange('happyHourPrices', 'pc.base', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m: <input type="number" value={config.happyHourPrices.pc.extra30m} onChange={e => handleChange('happyHourPrices', 'pc.extra30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Wheel</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>&lt;= 30m: <input type="number" value={config.happyHourPrices.wheel.less30m} onChange={e => handleChange('happyHourPrices', 'wheel.less30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Base (60m): <input type="number" value={config.happyHourPrices.wheel.base} onChange={e => handleChange('happyHourPrices', 'wheel.base', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 60m: <input type="number" value={config.happyHourPrices.wheel.extra60m} onChange={e => handleChange('happyHourPrices', 'wheel.extra60m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>
                        </div>

                        {/* NORMAL HOUR PRICES */}
                        <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #1e3a8a' }}>
                            <h4 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.1rem' }}>Normal Hour Prices</h4>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>PS5</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>1 Person: <input type="number" value={config.normalHourPrices.ps5.onePerson} onChange={e => handleChange('normalHourPrices', 'ps5.onePerson', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>2 Person: <input type="number" value={config.normalHourPrices.ps5.twoPerson} onChange={e => handleChange('normalHourPrices', 'ps5.twoPerson', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Multi Person Mod: <input type="number" value={config.normalHourPrices.ps5.multiplePersonBaseMod} onChange={e => handleChange('normalHourPrices', 'ps5.multiplePersonBaseMod', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m Mod: <input type="number" value={config.normalHourPrices.ps5.extra30mMod} onChange={e => handleChange('normalHourPrices', 'ps5.extra30mMod', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>PC</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Base (60m): <input type="number" value={config.normalHourPrices.pc.base} onChange={e => handleChange('normalHourPrices', 'pc.base', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m: <input type="number" value={config.normalHourPrices.pc.extra30m} onChange={e => handleChange('normalHourPrices', 'pc.extra30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>&gt;3h Hour Rate: <input type="number" value={config.normalHourPrices.pc.hourRateIfMoreThan3h} onChange={e => handleChange('normalHourPrices', 'pc.hourRateIfMoreThan3h', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Wheel</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>&lt;= 30m: <input type="number" value={config.normalHourPrices.wheel.less30m} onChange={e => handleChange('normalHourPrices', 'wheel.less30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Base (60m): <input type="number" value={config.normalHourPrices.wheel.base} onChange={e => handleChange('normalHourPrices', 'wheel.base', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m: <input type="number" value={config.normalHourPrices.wheel.extra30m} onChange={e => handleChange('normalHourPrices', 'wheel.extra30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>
                        </div>

                        {/* FUN NIGHT PRICES */}
                        <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #9d174d' }}>
                            <h4 style={{ color: '#ec4899', marginBottom: '1rem', fontSize: '1.1rem' }}>Fun Night Prices</h4>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>PS5</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>1 Person: <input type="number" value={config.funNightPrices.ps5.onePerson} onChange={e => handleChange('funNightPrices', 'ps5.onePerson', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Multi Person Mod: <input type="number" value={config.funNightPrices.ps5.multiplePersonBaseMod} onChange={e => handleChange('funNightPrices', 'ps5.multiplePersonBaseMod', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m Mod: <input type="number" value={config.funNightPrices.ps5.extra30mMod} onChange={e => handleChange('funNightPrices', 'ps5.extra30mMod', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>PC</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Base (60m): <input type="number" value={config.funNightPrices.pc.base} onChange={e => handleChange('funNightPrices', 'pc.base', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m: <input type="number" value={config.funNightPrices.pc.extra30m} onChange={e => handleChange('funNightPrices', 'pc.extra30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>&gt;3h Hour Rate: <input type="number" value={config.funNightPrices.pc.hourRateIfMoreThan3h} onChange={e => handleChange('funNightPrices', 'pc.hourRateIfMoreThan3h', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>

                            <h5 style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Wheel</h5>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>&lt;= 30m: <input type="number" value={config.funNightPrices.wheel.less30m} onChange={e => handleChange('funNightPrices', 'wheel.less30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Base (60m): <input type="number" value={config.funNightPrices.wheel.base} onChange={e => handleChange('funNightPrices', 'wheel.base', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>Extra 30m: <input type="number" value={config.funNightPrices.wheel.extra30m} onChange={e => handleChange('funNightPrices', 'wheel.extra30m', Number(e.target.value))} style={{ width: '80px', padding: '0.2rem', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} /></label>
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" disabled={saving} style={{ padding: '1rem 3rem', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: 'background-color 0.2s' }}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PricingConfigPage;
