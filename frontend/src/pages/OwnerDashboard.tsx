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
import SubscriptionOverview from "../components/owner/SubscriptionOverview.tsx";
import RecentTransactions from '../components/owner/RecentTransactions';

import OwnerPieCharts from '../components/owner/OwnerPieCharts';
import DeletionLogs from '../components/owner/DeletionLogs';
import SnackOverview from '../components/owner/SnackOverview'; // Import SnackOverview
import { useSessionExport } from '../components/owner/ExportSessionsReport';

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
        const fetchDashboardData = async () => {
            setLoading(true);
            const range = timeFilter.toLowerCase().replace(' ', '');

            try {
                // Fetch stats and revenue flow in parallel to avoid race conditions
                const [statsRes, flowRes] = await Promise.all([
                    fetch(`/api/owner/ownerstat?range=${range}`),
                    fetch(`/api/owner/revenueflow?range=${range}`)
                ]);

                const statsData = await statsRes.json();
                const flowData = await flowRes.json();

                setKpiStats(statsData.kpiStats || []);

                // Use flowData specifically for the chart
                setRevenueTrends(flowData.data || []);
                setChartMode(flowData.groupBy || 'hour');

            } catch (err) {
                console.error('❌ Dashboard data fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeFilter]);



    const filterOptions = ['Today', 'Yesterday', 'Last Week', 'This Month'];

    const { exportData, loading: exportLoading } = useSessionExport();

    const handleDownload = () => {
        exportData();
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
                            label={exportLoading ? "Exporting..." : "Export"}
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
                                <ResponsiveContainer width="100%" height={350}>
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
                        <SubscriptionOverview />
                    </div>
                </section>

                {/* 5. Snacks & Deletion Audits */}
                <section className="operational-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                    <SnackOverview />
                    <DeletionLogs />
                </section>

            </div>
        </DashboardLayout>
    );
};

export default OwnerDashboard;
