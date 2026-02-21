import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUserFriends,
    FaGamepad,
    FaHamburger,
    FaChartLine,
    FaTrophy,
    FaBolt,
    FaClock,
    FaChartPie
} from 'react-icons/fa';
import { MdTrendingUp, MdDashboard, MdFastfood } from 'react-icons/md';

import DashboardLayout from '../layouts/DashboardLayout';

// Charts
import DeviceOccupancyChart from '../components/analytics/DeviceOccupancyChart';
import PeakHoursChart from '../components/analytics/PeakHoursChart';
import DeviceUsageChart from '../components/analytics/DeviceUsageChart';
import SnacksConsumptionChart from '../components/analytics/SnacksConsumptionChart';
import GrowthComparisonChart from '../components/analytics/GrowthComparisonChart';
import BattleLeaderboard from '../components/analytics/BattleLeaderboard';
import ThunderCoinsLeaderboard from '../components/analytics/ThunderCoinsLeaderboard';

import './Analytics.css';

// --- Local Components ---

const StatBox = ({ title, value, icon, trend, color = "var(--analytics-accent)" }: any) => (
    <motion.div
        className="stat-card-modern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ translateY: -5 }}
        style={{ borderLeft: `4px solid ${color}` }}
    >
        <div className="stat-header">
            <span className="stat-title">{title}</span>
            <span className="stat-icon" style={{ color: color }}>{icon}</span>
        </div>
        <div className="stat-value">
            {value}
        </div>
        {trend && (
            <div className="stat-trend">
                <MdTrendingUp /> {trend}
            </div>
        )}
    </motion.div>
);

const SectionHeader = ({ title, subtitle, icon }: any) => (
    <div className="chart-header">
        <h3 className="chart-title">
            {icon && <span style={{ color: 'var(--analytics-accent)', marginRight: '8px' }}>{icon}</span>}
            {title}
        </h3>
        {subtitle && <p className="chart-desc">{subtitle}</p>}
    </div>
);

const ChartCard = ({ children, title, subtitle, icon, colSpan = 1 }: any) => (
    <motion.div
        className="chart-card-modern"
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ gridColumn: `span ${colSpan}` }}
    >
        <SectionHeader title={title} subtitle={subtitle} icon={icon} />
        <div style={{ position: 'relative', width: '100%', minHeight: '300px' }}>
            {children}
        </div>
    </motion.div>
);

const Analytics: React.FC = () => {
    const [stats, setStats] = useState({
        totalEntries: 0,
        mostPopularDevice: '—',
        topSnack: '—',
        peakHour: '—'
    });

    // Tabs state
    const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'food' | 'community'>('overview');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('https://thunder-management.onrender.com/api/analytics/last-24-hours');
                setStats(res.data);
            } catch (err) {
                console.error('Analytics fetch error', err);
            }
        };

        fetchStats();
    }, []);

    return (
        <DashboardLayout>
            <div className="analytics-container">
                {/* Visual Backgrounds */}
                <div className="analytics-bg-glow" />
                <div className="analytics-grid-pattern" style={{ opacity: 0.1 }} />

                <div className="analytics-content">
                    {/* Header */}
                    <header className="analytics-header">
                        <div>
                            <motion.h1
                                className="analytics-title"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                Thunder <span style={{ color: 'var(--analytics-accent)' }}>Analytics</span>
                            </motion.h1>
                            <motion.div
                                className="analytics-subtitle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="live-indicator" />
                                <span>System Operational • Live Data Feed</span>
                            </motion.div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="tabs-list">
                            <button
                                className={`tab-trigger ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <MdDashboard style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Overview
                            </button>
                            <button
                                className={`tab-trigger ${activeTab === 'devices' ? 'active' : ''}`}
                                onClick={() => setActiveTab('devices')}
                            >
                                <FaGamepad style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Devices
                            </button>
                            <button
                                className={`tab-trigger ${activeTab === 'food' ? 'active' : ''}`}
                                onClick={() => setActiveTab('food')}
                            >
                                <MdFastfood style={{ marginRight: '6px', verticalAlign: 'middle' }} /> F&B
                            </button>
                            <button
                                className={`tab-trigger ${activeTab === 'community' ? 'active' : ''}`}
                                onClick={() => setActiveTab('community')}
                            >
                                <FaTrophy style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Community
                            </button>
                        </div>
                    </header>

                    {/* Key Metrics Row (Always Visible) */}
                    <div className="stats-grid">
                        <StatBox
                            title="Total Entries"
                            value={stats.totalEntries}
                            icon={<FaUserFriends />}
                            gradient="from-blue-500 to-cyan-500"
                        />
                        <StatBox
                            title="Peak Hour"
                            value={stats.peakHour}
                            icon={<FaClock />}
                            color="#10b981"
                        />
                        <StatBox
                            title="Top Device"
                            value={stats.mostPopularDevice.toUpperCase()}
                            icon={<FaGamepad />}
                            color="#8b5cf6"
                        />
                        <StatBox
                            title="Top Snack"
                            value={stats.topSnack !== 'N/A' ? stats.topSnack.split(',')[0].replace(/x\d+/g, '').trim() : '—'}
                            icon={<FaHamburger />}
                            color="#f59e0b"
                        />
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="charts-grid"
                            >
                                {/* Growth Chart (Full Width) */}
                                <ChartCard title="Sessions Growth" subtitle="Comparative analysis of session volume" icon={<FaChartLine />}>
                                    <GrowthComparisonChart />
                                </ChartCard>

                                <div className="charts-grid grid-cols-2" style={{ marginBottom: 0 }}>
                                    <ChartCard title="Peak Hours" subtitle="Activity heat map by time of day" icon={<FaClock />}>
                                        <PeakHoursChart />
                                    </ChartCard>
                                    <ChartCard title="Current Occupancy" subtitle="Real-time device utilization" icon={<FaChartPie />}>
                                        <DeviceOccupancyChart />
                                    </ChartCard>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'devices' && (
                            <motion.div
                                key="devices"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="charts-grid grid-cols-2"
                            >
                                <ChartCard title="Device Usage Trends" subtitle="Which consoles are playing the most?" icon={<FaGamepad />} colSpan={2}>
                                    <DeviceUsageChart />
                                </ChartCard>
                                <ChartCard title="Occupancy Distribution" subtitle="Active sessions per device type" icon={<FaChartPie />}>
                                    <DeviceOccupancyChart />
                                </ChartCard>
                                {/* Placeholder for maintenance or other device stats if available in future */}
                            </motion.div>
                        )}

                        {activeTab === 'food' && (
                            <motion.div
                                key="food"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChartCard title="Snacks & Beverages" subtitle="Consumption metrics" icon={<MdFastfood />}>
                                    <SnacksConsumptionChart />
                                </ChartCard>
                            </motion.div>
                        )}

                        {activeTab === 'community' && (
                            <motion.div
                                key="community"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="charts-grid grid-cols-2"
                            >
                                <ChartCard title="Battle Arena" subtitle="Top PVP Champions" icon={<FaBolt />}>
                                    <BattleLeaderboard />
                                </ChartCard>
                                <ChartCard title="Thunder Coins" subtitle="Loyalty Program Leaders" icon={<FaTrophy />}>
                                    <ThunderCoinsLeaderboard />
                                </ChartCard>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
