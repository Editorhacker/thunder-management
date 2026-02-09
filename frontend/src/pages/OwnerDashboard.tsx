import React, { useState, useMemo, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    FaCalendarAlt, FaDownload, FaChartLine, FaRobot, FaUserCog
} from 'react-icons/fa';

import { motion } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import {
    KPI_STATS, REVENUE_TRENDS
} from '../data/mockOwnerData';

import {
    GlassCard, GradientTitle, TabGroup, ActionButton, QuickStat
} from '../components/owner/ui/ModernComponents';

import LiveFloorStatus from '../components/owner/LiveFloorStatus';
import RecentTransactions from '../components/owner/RecentTransactions';
import SnackSalesComparison from '../components/owner/SnackSalesComparison';
import OwnerPieCharts from '../components/owner/OwnerPieCharts';

import './OwnerDashboard.css';

const OwnerDashboard: React.FC = () => {
    const [timeFilter, setTimeFilter] = useState('Today');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(interval);
    }, []);

    const filterOptions = ['Today', 'Yesterday', 'Last Week', 'This Month'];

    // Data Filtering logic
    const currentStats = useMemo(() => {
        const key = timeFilter.replace(' ', '').replace(/^./, str => str.toLowerCase());
        return KPI_STATS[key as keyof typeof KPI_STATS] || KPI_STATS['today'];
    }, [timeFilter]);

    const handleDownload = () => {
        // ... previous download logic
        alert("Downloading Report...");
    };

    // Helper for Icons
    const getIconForLabel = (label: string) => {
        if (label.includes('Revenue')) return FaChartLine;
        if (label.includes('Time')) return FaCalendarAlt;
        return FaRobot;
    };

    return (
        <DashboardLayout>
            <div className="owner-dashboard-container">
                {/* 1. Header Section */}
                <motion.header
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="header-left">
                        <h1 className="header-title">Command Center</h1>
                        <p className="header-subtitle"><FaUserCog className="inline-icon" /> Welcome back, Owner</p>
                    </div>

                    <div className="header-center">
                        <div className="live-clock">{currentTime}</div>
                    </div>

                    <div className="header-actions">
                        <TabGroup options={filterOptions} active={timeFilter} onChange={setTimeFilter} />
                        <ActionButton
                            icon={FaDownload}
                            label="Export"
                            onClick={handleDownload}
                            variant="primary"
                        />
                    </div>
                </motion.header>

                {/* 2. KPI Hero Section (Top 4 Stats) */}
                <section className="hero-stats-grid">
                    {currentStats.map((stat: { label: string; value: string | number; change: string }, idx: number) => (
                        <QuickStat
                            key={idx}
                            label={stat.label}
                            value={String(stat.value)}
                            trend={stat.change}
                            icon={getIconForLabel(stat.label)}
                            delay={idx * 0.1}
                        />
                    ))}
                </section>

                {/* 3. The "Pulse" - Central Operational View */}
                <section className="operational-grid">
                    {/* Left: Revenue Chart (Wider) */}
                    <div className="main-chart-area">
                        <GlassCard className="chart-panel">
                            <div className="panel-header">
                                <GradientTitle size="medium">Revenue Flow</GradientTitle>
                            </div>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={REVENUE_TRENDS}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#a78bfa' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRev)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right: Live Floor Status */}
                    <div className="floor-status-area">
                        <LiveFloorStatus />
                    </div>
                </section>

                {/* 4. Secondary Grid: Pie Charts & Transactions */}
                <section className="secondary-grid">
                    <div className="pie-charts-area">
                        <OwnerPieCharts />
                    </div>
                    <div className="transactions-area">
                        <RecentTransactions />
                    </div>
                </section>

                {/* 5. Bottom: Detailed Snack Analysis */}
                <section className="bottom-section">
                    <SnackSalesComparison />
                </section>

            </div>
        </DashboardLayout>
    );
};

export default OwnerDashboard;
