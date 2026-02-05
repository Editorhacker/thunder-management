import { useState, useEffect } from 'react';
import { GiCrossedSwords, GiTrophyCup } from 'react-icons/gi';
import { FaFire } from 'react-icons/fa';
import axios from 'axios';
import './ActiveBattles.css';


interface BattlePlayer {
    name: string;
    phone: string;
    score: number;
}

interface Battle {
    id: string; // ID is string from firebase
    crownHolder: BattlePlayer;
    challenger: BattlePlayer;
    startTime: string; // ISO string
}

const ActiveBattles = () => {
    const [battles, setBattles] = useState<Battle[]>([]);

    // Fetch Battles
    const fetchBattles = async () => {
        try {
            console.log('🔄 Fetching battles from API...');
            const res = await axios.get('http://localhost:5000/api/battles/active');
            console.log('✅ Battles fetched:', res.data);
            setBattles(res.data);
        } catch (error) {
            console.error("❌ Failed to fetch battles:", error);
        }
    };

    useEffect(() => {
        fetchBattles();
        const interval = setInterval(fetchBattles, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const updateScore = async (id: string, player: 'crownHolder' | 'challenger') => {
        try {
            // Optimistic update
            setBattles(prev => prev.map(b => {
                if (b.id !== id) return b;
                return {
                    ...b,
                    [player]: {
                        ...b[player],
                        score: b[player].score + 1
                    }
                };
            }));

            await axios.post(`http://localhost:5000/api/battles/score/${id}`, { player });
        } catch (error) {
            console.error(error);
            fetchBattles(); // Revert on error
        }
    };

    const finishBattle = async (id: string) => {
        if (!window.confirm("End this battle?")) return;

        try {
            await axios.post(`http://localhost:5000/api/battles/finish/${id}`);
            fetchBattles(); // Refresh list to remove it
        } catch (error) {
            console.error(error);
        }
    };


    // Helper for duration
    const getDuration = (startTime: string) => {
        const diff = Date.now() - new Date(startTime).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins}m elapsed`;
    };

    return (
        <section className="active-battles-container">
            <div className="battles-header">
                <h3 className="battles-title">
                    <GiCrossedSwords style={{ color: '#ef4444' }} />
                    Live Battles
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                    {battles.length} active matches
                </span>
            </div>

            {battles.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: '#71717a',
                    background: '#18181b',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <GiCrossedSwords size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No active battles</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Start a new battle to see it here</p>
                </div>
            ) : (
                <div className="battles-grid">
                    {battles.map(battle => (
                        <div key={battle.id} className="battle-card">
                            {/* Status Bar */}
                            <div className="battle-status-bar">
                                <div className="live-badge">
                                    <div className="live-dot" /> LIVE
                                </div>
                                <span>{getDuration(battle.startTime)}</span>
                            </div>

                            {/* Content */}
                            <div className="battle-content">
                                <div className="battle-vs-layout">
                                    {/* Crown Holder (Left) */}
                                    <div className="player-side">
                                        <div className="crown-hold player-score">
                                            {battle.crownHolder.score}
                                        </div>
                                        <span className="player-name">{battle.crownHolder.name}</span>
                                        <div className="player-meta text-yellow-500/80 flex items-center gap-1">
                                            <GiTrophyCup /> Crown Holder
                                        </div>
                                    </div>

                                    {/* VS Divider */}
                                    <div className="vs-divider">VS</div>

                                    {/* Challenger (Right) */}
                                    <div className="player-side challenger">
                                        <div className="chal-hold player-score">
                                            {battle.challenger.score}
                                        </div>
                                        <span className="player-name">{battle.challenger.name}</span>
                                        <div className="player-meta text-blue-500/80 flex items-center gap-1 justify-end">
                                            Challenger <FaFire />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="battle-footer">
                                <button className="action-btn" onClick={() => updateScore(battle.id, 'crownHolder')}>+ Crown Score</button>
                                <button className="action-btn" onClick={() => updateScore(battle.id, 'challenger')}>+ Chal. Score</button>
                                <button className="action-btn finish" onClick={() => finishBattle(battle.id)}>Finish Match</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default ActiveBattles;
