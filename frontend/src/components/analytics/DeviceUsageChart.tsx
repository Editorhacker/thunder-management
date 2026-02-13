import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

interface DeviceUsageData {
    name: string;
    usage: number;
}

const DeviceUsageChart: React.FC = () => {
    const [data, setData] = useState<DeviceUsageData[]>([]);

    useEffect(() => {
        const fetchDeviceUsage = async () => {
            try {
                const res = await axios.get('https://thunder-management.onrender.com/api/analytics/deviceusage');

                // 🔒 Safety: Recharts needs array
                if (Array.isArray(res.data)) {
                    setData(res.data);
                } else {
                    console.error('Unexpected device usage response:', res.data);
                    setData([]);
                }
            } catch (error) {
                console.error('Device usage fetch error', error);
                setData([]);
            }
        };

        fetchDeviceUsage();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="cyber-card"
            style={{
                padding: "24px",
                height: "400px",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <h3 style={{
                color: "var(--text-primary)",
                marginBottom: "20px",
                textAlign: "left",
                fontFamily: "var(--font-display)",
                fontSize: '1.1rem',
                borderLeft: '3px solid var(--accent-yellow)',
                paddingLeft: '12px'
            }}>
                Device Popularity
            </h3>

            <div style={{ flex: 1, width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >

                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="var(--border-color)"
                        />

                        <XAxis
                            type="number"
                            stroke="var(--text-secondary)"
                            allowDecimals={false}
                        />

                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="var(--text-secondary)"
                            width={60}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                        />

                        <Tooltip
                            cursor={{ fill: 'var(--border-color)', opacity: 0.4 }}
                            contentStyle={{
                                backgroundColor: 'var(--bg-dark)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: 'var(--accent-yellow)' }}
                        />

                        <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />

                        <Bar
                            dataKey="usage"
                            fill="var(--accent-yellow)"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default DeviceUsageChart;
