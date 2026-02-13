import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    FaCalendarAlt, FaDownload, FaChartLine, FaRobot, FaUserCog
} from 'react-icons/fa';
import { motion } from 'framer-motion';

import DashboardLayout from '../layouts/DashboardLayout';
import {
    GlassCard, GradientTitle, TabGroup, ActionButton, QuickStat
} from '../components/owner/ui/ModernComponents';
import SubscriptionCard from '../components/owner/SubscriptionCard';
import RecentTransactions from '../components/owner/RecentTransactions';

import OwnerPieCharts from '../components/owner/OwnerPieCharts';
import SnackOverview from '../components/owner/SnackOverview'; // Import SnackOverview

import './OwnerDashboard.css';

interface KPIStat {
    label: string;
    value: string | number;
    trend: number;
}

const OwnerDashboard: React.FC = () => {
    const [timeFilter, setTimeFilter] = useState('Today');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    const [chartMode, setChartMode] = useState<'hour' | 'day'>('hour');
    const [kpiStats, setKpiStats] = useState<KPIStat[]>([]);
    const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Live clock
    useEffect(() => {
        const interval = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString()),
            1000
        );
        return () => clearInterval(interval);
    }, []);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);

                const range = timeFilter.toLowerCase().replace(' ', '');
                const res = await fetch(`https://thunder-management.onrender.com/api/owner/ownerstat?range=${range}`);
                const data = await res.json();

                setKpiStats(data.kpiStats || []);
                setRevenueTrends(data.revenueTrends || []);
            } catch (err) {
                console.error('❌ Dashboard fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [timeFilter]);
    useEffect(() => {
        const fetchRevenueFlow = async () => {
            try {
                const range = timeFilter.toLowerCase().replace(' ', '');
                const res = await fetch(
                    `https://thunder-management.onrender.com/api/owner/revenueflow?range=${range}`
                );
                const data = await res.json();

                setRevenueTrends(data.data || []);
                setChartMode(data.groupBy || 'hour');
            } catch (err) {
                console.error('❌ Revenue flow fetch failed', err);
            }
        };

        fetchRevenueFlow();
    }, [timeFilter]);



    const filterOptions = ['Today', 'Yesterday', 'Last Week', 'This Month'];

    const handleDownload = () => {
        alert('Downloading Report...');
    };

    // Icon helper
    const getIconForLabel = (label: string) => {
        if (label.includes('Revenue')) return FaChartLine;
        if (label.includes('Time')) return FaCalendarAlt;
        return FaRobot;
    };

    return (
        <DashboardLayout>
            <div className="owner-dashboard-container">

                {/* 1. Header */}
                <motion.header
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="header-left">
                        <h1 className="header-title">Command Center</h1>
                        <p className="header-subtitle">
                            <FaUserCog className="inline-icon" /> Welcome back, Owner
                        </p>
                    </div>

                    <div className="header-center">
                        <div className="live-clock">{currentTime}</div>
                    </div>

                    <div className="header-actions">
                        <TabGroup
                            options={filterOptions}
                            active={timeFilter}
                            onChange={setTimeFilter}
                        />
                        <ActionButton
                            icon={FaDownload}
                            label="Export"
                            onClick={handleDownload}
                            variant="primary"
                        />
                    </div>
                </motion.header>

                {/* 2. KPI Cards */}
                <section className="hero-stats-grid">
                    {!loading && kpiStats.map((stat, idx) => (
                        <QuickStat
                            key={idx}
                            label={stat.label}
                            value={String(stat.value)}
                            trend={Number(stat.trend) || 0}
                            icon={getIconForLabel(stat.label)}
                            delay={idx * 0.1}
                        />
                    ))}
                </section>

                {/* 3. Revenue + Floor */}
                <section className="operational-grid">
                    <div className="main-chart-area">
                        <GlassCard className="chart-panel">
                            <div className="panel-header">
                                <GradientTitle size="medium">Revenue Flow</GradientTitle>
                            </div>

                            <div className="chart-wrapper">
                                <ResponsiveContainer width="90%" height="100%">
                                    <AreaChart data={revenueTrends}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.05)"
                                            vertical={false}
                                        />

                                        {/* X Axis = Hour */}
                                        <XAxis
                                            dataKey="time"
                                            stroke="#64748b"
                                            fontSize={11}
                                            tickFormatter={(val) =>
                                                chartMode === 'hour' ? `${val}:00` : val
                                            }
                                            tickLine={false}
                                            axisLine={false}
                                        />


                                        {/* Y Axis = Revenue */}
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={11}
                                            tickFormatter={(v) => `₹${v}`}
                                            tickLine={false}
                                            axisLine={false}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: 'none',
                                                borderRadius: '8px'
                                            }}
                                            formatter={(value?: number) => [`₹${value ?? 0}`, 'Revenue']}
                                            labelFormatter={(label) =>
                                                chartMode === 'hour' ? `${label}:00` : label
                                            }
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fill="url(#colorRev)"
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>

                            </div>
                        </GlassCard>
                    </div>

                    <OwnerPieCharts timeFilter={timeFilter} />
                </section>

                {/* 4. Secondary */}
                <section className="secondary-grid">
                    <div className="pie-charts-area">
                        <RecentTransactions timeFilter={timeFilter} />

                    </div>
                    <div className="transactions-area">
                        <SubscriptionCard />
                    </div>
                </section>

                {/* 5. Snacks */}
                <section className="bottom-section" style={{ marginTop: '1.5rem' }}>
                    <SnackOverview />
                </section>

            </div>
        </DashboardLayout>
    );
};

export default OwnerDashboard;
