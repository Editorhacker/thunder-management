
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

// Premium Color Palette
const GOLD_COLOR = '#fbbf24'; // Amber-400
const BLUE_COLOR = '#3b82f6'; // Blue-500
const EMPTY_COLOR = 'rgba(59, 130, 246, 0.1)'; // Faint Blue

interface DataItem {
    name: string;
    value: number;
    color: string;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const { name, value, color } = payload[0].payload;
        return (
            <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${color}`,
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                minWidth: '150px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                    <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>{name}</span>
                </div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {value} <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>devices</span>
                </div>
            </div>
        );
    }
    return null;
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: `drop-shadow(0 0 6px ${fill})` }}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={innerRadius - 8}
                outerRadius={innerRadius - 4}
                fill={fill}
                opacity={0.3}
            />
        </g>
    );
};

const DeviceOccupancyChart: React.FC = () => {
    const [data, setData] = useState<DataItem[]>([
        { name: 'Occupied', value: 0, color: GOLD_COLOR },
        { name: 'Available', value: 0, color: EMPTY_COLOR }
    ]);
    const [, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchOccupancy = async () => {
            try {
                // Simulating fetch or real fetch
                const res = await axios.get('https://thunder-management.onrender.com/api/analytics/deviceoccupancy');

                // Assuming API returns { occupied: number, remaining: number }
                // Use fallback values if API fails or returns 0 initially for visuals
                const occupied = res.data.occupied || 0;
                const remaining = res.data.remaining || 0;

                setData([
                    { name: 'Occupied', value: occupied, color: GOLD_COLOR },
                    { name: 'Available', value: remaining, color: BLUE_COLOR } // Using Blue for available instead of faint for better contrast in "Blue & Golden" theme
                ]);
            } catch (error) {
                console.error('Occupancy fetch error', error);
                // Fallback demo data
                setData([
                    { name: 'Occupied', value: 12, color: GOLD_COLOR },
                    { name: 'Available', value: 8, color: BLUE_COLOR }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchOccupancy();
    }, []);

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const occupiedCount = data.find(d => d.name === 'Occupied')?.value || 0;
    const occupancyRate = total > 0 ? Math.round((occupiedCount / total) * 100) : 0;

    // Fallback for visual rendering if no data
    const chartData = total > 0 ? data : [
        { name: 'Occupied', value: 0, color: GOLD_COLOR },
        { name: 'Available', value: 1, color: 'rgba(255,255,255,0.05)' }
    ];

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    return (
        <div style={{ width: '100%', height: '350px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Center Stats Overlay */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 10,
                marginTop: '-10px' // Offset for footer
            }}>
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                >
                    <div style={{
                        fontSize: '3rem',
                        fontWeight: 800,
                        color: GOLD_COLOR,
                        textShadow: `0 0 20px rgba(251, 191, 36, 0.4)`,
                        lineHeight: 1,
                        fontFamily: 'Orbitron, sans-serif'
                    }}>
                        {occupancyRate}%
                    </div>
                </motion.div>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#fbbf24" />
                            </linearGradient>
                            <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#1e3a8a" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <Pie
                            {...({
                                activeIndex: activeIndex,
                                activeShape: renderActiveShape,
                                data: chartData,
                                cx: "50%",
                                cy: "50%",
                                innerRadius: 85,
                                outerRadius: 110,
                                paddingAngle: 4,
                                dataKey: "value",
                                onMouseEnter: onPieEnter,
                                className: "cursor-pointer",
                                stroke: "none"
                            } as any)}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.name === 'Occupied' ? 'url(#goldGradient)' : 'url(#blueGradient)'}
                                    style={{
                                        filter: entry.name === 'Occupied' ? 'url(#glow)' : 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '-10px',
                position: 'relative',
                zIndex: 20
            }}>
                {data.map((entry, index) => (
                    <motion.div
                        key={entry.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '2px',
                            background: entry.name === 'Occupied' ? GOLD_COLOR : BLUE_COLOR,
                            boxShadow: `0 0 8px ${entry.name === 'Occupied' ? GOLD_COLOR : BLUE_COLOR}`
                        }} />
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                            {entry.name}: <span style={{ fontWeight: 'bold' }}>{entry.value}</span>
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default DeviceOccupancyChart;
