import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

const COLORS = ['#fbbf24', '#1e293b'];
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const { name, value, fill } = payload[0];

        return (
            <div
                style={{
                    backgroundColor: 'var(--bg-dark)',
                    border: `1px solid ${fill}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: fill
                        }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {name}
                    </span>
                </div>

                <div
                    style={{
                        marginTop: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem'
                    }}
                >
                    {value} devices
                </div>
            </div>
        );
    }

    return null;
};


const DeviceOccupancyChart: React.FC = () => {
    const [data, setData] = useState([
        { name: 'Occupied', value: 0 },
        { name: 'Remaining', value: 0 }
    ]);

    useEffect(() => {
        const fetchOccupancy = async () => {
            try {
                const res = await axios.get('https://thunder-management.vercel.app/api/analytics/deviceoccupancy');
                setData([
                    { name: 'Occupied', value: res.data.occupied },
                    { name: 'Remaining', value: res.data.remaining }
                ]);
            } catch (error) {
                console.error('Occupancy fetch error', error);
            }
        };

        fetchOccupancy();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
                fontFamily: "var(--font-display)",
                fontSize: '1.1rem',
                borderLeft: '3px solid var(--accent-yellow)',
                paddingLeft: '12px'
            }}>
                Device Occupancy (Last 24 hrs)
            </h3>

            <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="#fbbf24"
                            label={({ name, percent }) =>
                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                            }
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index]}
                                />
                            ))}
                        </Pie>

                        <Tooltip content={<CustomTooltip />} />


                        <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{ color: 'var(--text-secondary)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default DeviceOccupancyChart;
