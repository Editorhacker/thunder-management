import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBolt, FaCrown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ThunderCoinsLeaderboard.css';

interface ThunderWinner {
    phone: string;
    name: string;
    thunderCoins: number;
}

type RangeType = 'weekly' | 'monthly';

const ThunderCoinsLeaderboard = () => {
    const [data, setData] = useState<ThunderWinner[]>([]);
    const [range, setRange] = useState<RangeType>('weekly');

    const fetchData = async () => {
        try {
            const res = await axios.get(
                `https://thunder-management.vercel.app/api/battles/thunder-leaderboard?range=${range}`
            );
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch thunder leaderboard', err);
        }
    };

    // 🔄 Live updates (every 5s)
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [range]);

    return (
        <div className="thunder-leaderboard-container">
            {/* Header */}
            <div className="thunder-leaderboard-header">
                <h3 className="thunder-leaderboard-title">
                    <FaBolt style={{ color: '#facc15' }} />
                    Thunder Coins
                </h3>

                {/* 📅 Toggle */}
                <div className="thunder-toggle">
                    <button
                        className={range === 'weekly' ? 'active' : ''}
                        onClick={() => setRange('weekly')}
                    >
                        Weekly
                    </button>
                    <button
                        className={range === 'monthly' ? 'active' : ''}
                        onClick={() => setRange('monthly')}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {/* Content */}
            {data.length === 0 ? (
                <div className="thunder-empty-state">
                    <FaBolt className="thunder-empty-icon" />
                    <p>No rewards yet</p>
                </div>
            ) : (
                <div className="thunder-leaderboard-list">
                    {data.map((item, index) => (
                        <div key={item.phone} className="thunder-leaderboard-item">
                            {/* Rank */}
                            <div
                                className={`thunder-rank-badge ${index === 0
                                    ? 'rank-1'
                                    : index === 1
                                        ? 'rank-2'
                                        : index === 2
                                            ? 'rank-3'
                                            : 'rank-default'
                                    }`}
                            >
                                {index === 0 ? <FaCrown /> : index + 1}
                            </div>

                            {/* Player */}
                            <div className="thunder-player-info">
                                <div className="thunder-player-name">
                                    {item.name}
                                </div>
                                <div className="thunder-player-meta">
                                    {item.phone}
                                </div>
                            </div>

                            {/* ⚡ Animated Coins */}
                            <motion.div
                                key={item.thunderCoins}
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="thunder-coin-count"
                            >
                                <FaBolt />
                                {item.thunderCoins}
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThunderCoinsLeaderboard;
