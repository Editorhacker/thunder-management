
import { motion } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/analytics/StatCard';
import DeviceOccupancyChart from '../components/analytics/DeviceOccupancyChart';
import PeakHoursChart from '../components/analytics/PeakHoursChart';
import DeviceUsageChart from '../components/analytics/DeviceUsageChart';
import SnacksConsumptionChart from '../components/analytics/SnacksConsumptionChart';
import GrowthComparisonChart from '../components/analytics/GrowthComparisonChart';
import BattleLeaderboard from '../components/analytics/BattleLeaderboard';
import ThunderCoinsLeaderboard from '../components/analytics/ThunderCoinsLeaderboard';
import { FaUserFriends, FaGamepad, FaHamburger } from 'react-icons/fa';
import { MdTrendingUp } from 'react-icons/md';
import React, { useEffect, useState } from 'react';
import axios from 'axios';



const Analytics: React.FC = () => {
    const [stats, setStats] = useState({
        totalEntries: 0,
        mostPopularDevice: '—',
        topSnack: '—',
        peakHour: '—'
    });

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
            <div style={{ paddingBottom: '2rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ marginBottom: '2rem' }}
                >
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Analytics <span style={{ color: 'var(--accent-yellow)' }}>Overview</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Real-time insights and performance metrics</p>
                </motion.div>

                {/* Top Stats Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', // Responsive grid
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <StatCard
                        title="Total Active Entries"
                        value={stats.totalEntries}
                        icon={<FaUserFriends />}
                        // trend="+12%"
                        trendIcon={<MdTrendingUp />}
                    />
                    <StatCard
                        title="Most Popular Device"
                        value={stats.mostPopularDevice.toUpperCase()}
                        icon={<FaGamepad />}
                        color="var(--accent-yellow)"
                    />
                    <StatCard
                        title="Top Selling Snack"
                        value={stats.topSnack}
                        icon={<FaHamburger />}
                        color="#f59e0b"
                    />
                    <StatCard
                        title="Peak Activity"
                        value={stats.peakHour}
                        icon={<MdTrendingUp />}
                        color="#10b981"
                    />
                </div>

                {/* Growth Chart - Full Width */}
                <div style={{
                    marginBottom: '24px'
                }}>
                    <GrowthComparisonChart />
                </div>

                {/* Main Charts Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                    gap: '24px',
                    marginBottom: '24px'
                }}>
                    <DeviceOccupancyChart />
                    <PeakHoursChart />
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                    gap: '24px',
                    marginBottom: '24px'
                }}>
                    <DeviceUsageChart />
                    <SnacksConsumptionChart />
                </div>

                {/* Battle Leaderboard - Full Width */}
                {/* Battle + Thunder Coins Leaderboards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '24px',
                        marginBottom: '24px'
                    }}
                >
                    <BattleLeaderboard />
                    <ThunderCoinsLeaderboard />
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Analytics;
