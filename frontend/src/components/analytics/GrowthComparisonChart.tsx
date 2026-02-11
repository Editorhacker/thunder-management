import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

interface GrowthData {
    day: string;
    lastMonth: number;
    thisMonth: number;
}

const GrowthComparisonChart: React.FC = () => {
    const [data, setData] = useState<GrowthData[]>([]);

    useEffect(() => {
        const fetchGrowth = async () => {
            try {
                const res = await axios.get('https://thunder-management.vercel.app//api/analytics/monthly');

                if (Array.isArray(res.data)) {
                    setData(res.data);
                } else {
                    console.error('Unexpected growth response:', res.data);
                    setData([]);
                }
            } catch (error) {
                console.error('Growth fetch error', error);
                setData([]);
            }
        };

        fetchGrowth();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="cyber-card"
            style={{
                padding: "24px",
                height: "400px",
                display: "flex",
                flexDirection: "column",
                width: "100%"
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{
                    color: "var(--text-primary)",
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: '1.1rem',
                    borderLeft: '3px solid var(--accent-yellow)',
                    paddingLeft: '12px'
                }}>
                    Customer Growth Comparison
                </h3>

                <div style={{
                    padding: '4px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    borderRadius: '20px',
                    color: '#10b981',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    This vs Last Month
                </div>
            </div>

            <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />

                        <XAxis
                            dataKey="day"
                            stroke="var(--text-secondary)"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                        />

                        <YAxis
                            stroke="var(--text-secondary)"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-dark)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px'
                            }}
                        />

                        <Legend wrapperStyle={{ color: 'var(--text-secondary)', paddingTop: '10px' }} />

                        <Line
                            type="monotone"
                            dataKey="lastMonth"
                            name="Last Month"
                            stroke="var(--text-muted)"
                            strokeWidth={2}
                            dot={{ fill: 'var(--text-muted)', r: 4 }}
                        />

                        <Line
                            type="monotone"
                            dataKey="thisMonth"
                            name="This Month"
                            stroke="var(--accent-yellow)"
                            strokeWidth={3}
                            dot={{ fill: 'var(--accent-yellow)', r: 4 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default GrowthComparisonChart;
