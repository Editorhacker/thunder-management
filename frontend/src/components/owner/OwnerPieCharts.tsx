import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { GlassCard, GradientTitle } from './ui/ModernComponents';

const COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#f97316'];

interface PieData {
    name: string;
    value: number;
}

interface Props {
    timeFilter: string;
}

const CustomPieChart = ({
    title,
    data
}: {
    title: string;
    data: PieData[];
}) => (
    <GlassCard>
        <GradientTitle size="medium">{title}</GradientTitle>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>

                    <Tooltip formatter={(v?: number) => [`₹${v ?? 0}`, 'Revenue']} />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </GlassCard>
);

const OwnerPieCharts: React.FC<Props> = ({ timeFilter }) => {
    const [machineRevenue, setMachineRevenue] = useState<PieData[]>([]);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const range = timeFilter.toLowerCase().replace(' ', '');
                const res = await fetch(
                    `https://thunder-management.vercel.app//api/owner/revenue-by-machine?range=${range}`
                );
                const data = await res.json();
                setMachineRevenue(data);
            } catch (err) {
                console.error('❌ Revenue by machine fetch failed', err);
            }
        };

        fetchRevenue();
    }, [timeFilter]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CustomPieChart
                title="Revenue by Machine"
                data={machineRevenue}
            />
        </div>
    );
};

export default OwnerPieCharts;
