import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

interface PeakHourData {
    time: string;
    users: number;
}

const PeakHoursChart: React.FC = () => {
    const [data, setData] = useState<PeakHourData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeakHours = async () => {
            try {
                const res = await axios.get('https://thunder-management.vercel.app//api/analytics/peakhours');

                if (Array.isArray(res.data)) {
                    setData(res.data);
                } else {
                    console.error('Unexpected API response:', res.data);
                    setData([]);
                }
            } catch (error) {
                console.error('Peak hours fetch error', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPeakHours();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="cyber-card"
            style={{
                padding: "24px",
                height: "400px",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <h3
                style={{
                    color: "var(--text-primary)",
                    marginBottom: "20px",
                    fontFamily: "var(--font-display)",
                    fontSize: '1.1rem',
                    borderLeft: '3px solid var(--accent-yellow)',
                    paddingLeft: '12px'
                }}
            >
                Peak Hours Activity (Last 24 hrs)
            </h3>

            <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {loading ? (
                        <div style={{
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            Loading...
                        </div>
                    ) : data.length === 0 ? (
                        <div style={{
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            No data available
                        </div>
                    ) : (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20 }}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-yellow)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent-yellow)" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <XAxis
                                dataKey="time"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                axisLine={{ stroke: 'var(--border-color)' }}
                            />

                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                axisLine={{ stroke: 'var(--border-color)' }}
                                allowDecimals={false}
                            />

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-color)"
                                vertical={false}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-dark)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px'
                                }}
                                itemStyle={{ color: 'var(--accent-yellow)' }}
                            />

                            <Area
                                type="monotone"
                                dataKey="users"
                                stroke="var(--accent-yellow)"
                                strokeWidth={2}
                                fill="url(#colorUsers)"
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default PeakHoursChart;
