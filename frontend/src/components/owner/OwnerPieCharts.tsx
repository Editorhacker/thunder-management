import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { motion } from 'framer-motion';
import { FaTrophy, FaChartPie, FaSpinner } from 'react-icons/fa';
import { GlassCard, GradientTitle } from './ui/ModernComponents';

// --- Constants & Config ---
const COLORS = [
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#3b82f6'  // Blue
];

const MACHINE_LABELS: Record<string, string> = {
    PS: 'PlayStation 5',
    PC: 'Gaming PC',
    VR: 'Virtual Reality',
    WHEEL: 'Racing Wheel',
    METABAT: 'MetaBat'
};

interface PieData {
    name: string;
    value: number;
}

interface Props {
    timeFilter: string;
}

// --- Helper Components ---

// Custom Active Shape for Hover Effect
const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
        cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#e2e8f0" className="text-xl font-bold">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                className="drop-shadow-lg"
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 12}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#cbd5e1" fontSize={12} >
                {`₹${(value || 0).toLocaleString()}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#94a3b8" fontSize={10}>
                {`(${(percent * 100).toFixed(1)}%)`}
            </text>
        </g>
    );
};

// --- Main Component ---
const OwnerPieCharts: React.FC<Props> = ({ timeFilter }) => {
    const [data, setData] = useState<PieData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, []);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                setLoading(true);
                const range = timeFilter.toLowerCase().replace(' ', '');
                // Using the optimized endpoint
                const res = await fetch(
                    `/api/owner/revenue-by-machine?range=${range}`
                );
                const result = await res.json();

                // Sort by value desc for better visualization
                const sorted = (result || []).sort((a: PieData, b: PieData) => b.value - a.value);
                setData(sorted);
                // Reset active index to top performer
                setActiveIndex(0);
            } catch (err) {
                console.error('❌ Revenue by machine fetch failed', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenue();
    }, [timeFilter]);

    // Derived Stats
    const totalRevenue = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
    const topPerformer = data.length > 0 ? data[0] : null;

    return (
        <GlassCard className="flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <GradientTitle size="medium">Machine Performance</GradientTitle>
                <div className="p-2 bg-white/5 rounded-full">
                    <FaChartPie className="text-purple-400" />
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <FaSpinner size={24} />
                    </motion.div>
                    <p className="text-sm font-medium">Analyzing revenue streams...</p>
                </div>
            ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    No revenue data for this period
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row items-center gap-8 h-full">

                    {/* Left: Chart */}
                    <div className="w-full lg:w-3/5 h-[300px] relative min-w-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    // @ts-ignore
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                    paddingAngle={3}
                                >
                                    {data.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth={1}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] bg-purple-500/10 rounded-full blur-xl -z-10" />
                    </div>

                    {/* Right: Legend & Insights */}
                    <div className="w-full lg:w-2/5 flex flex-col gap-4">

                        {/* Top Performer Card */}
                        {topPerformer && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4"
                            >
                                <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
                                    <FaTrophy size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-amber-200/70 uppercase tracking-wider font-semibold">Top Performer</p>
                                    <h4 className="text-lg font-bold text-amber-100">{MACHINE_LABELS[topPerformer.name] || topPerformer.name}</h4>
                                    <p className="text-sm text-amber-200/60">
                                        Generates <span className="text-white font-medium">{totalRevenue > 0 ? ((topPerformer.value / totalRevenue) * 100).toFixed(0) : 0}%</span> of total revenue
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Detailed List */}
                        <div className="flex flex-col gap-2 mt-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {data.map((entry, index) => (
                                <motion.div
                                    key={entry.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${activeIndex === index
                                        ? 'bg-white/10 border-white/20'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full shadow-[0_0_8px]"
                                            style={{ backgroundColor: COLORS[index % COLORS.length], boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}` }}
                                        />
                                        <span className="text-sm font-medium text-slate-200">
                                            {MACHINE_LABELS[entry.name] || entry.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">₹{(entry.value || 0).toLocaleString()}</div>
                                        <div className="text-xs text-slate-400">{totalRevenue > 0 ? ((entry.value / totalRevenue) * 100).toFixed(1) : 0}%</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </GlassCard>
    );
};

export default OwnerPieCharts;
