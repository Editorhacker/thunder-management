import { useState, useEffect } from 'react';
import axios from 'axios';
import { GiTrophyCup, GiCrossedSwords } from 'react-icons/gi';
import { FaCrown } from 'react-icons/fa';
import './BattleLeaderboard.css';

interface BattlePlayer {
    name: string;
    phone: string;
    age?: string;
    score: number;
}

interface CompletedBattle {
    id: string;
    crownHolder: BattlePlayer;
    challenger: BattlePlayer;
    startTime: string;
    endTime: string;
    winner?: 'crownHolder' | 'challenger' | 'tie';
}

interface LeaderboardEntry {
    name: string;
    wins: number;
    totalBattles: number;
    totalScore: number;
    winRate: number;
}

const BattleLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        fetchCompletedBattles();
    }, []);

    const fetchCompletedBattles = async () => {
        try {
            const res = await axios.get('https://thunder-management.onrender.com/api/battles/completed');
            const completedBattles = res.data;

            // Calculate leaderboard
            const playerStats = new Map<string, LeaderboardEntry>();

            completedBattles.forEach((battle: CompletedBattle) => {
                // Process Crown Holder
                processBattlePlayer(
                    battle.crownHolder,
                    battle.winner === 'crownHolder',
                    playerStats
                );

                // Process Challenger
                processBattlePlayer(
                    battle.challenger,
                    battle.winner === 'challenger',
                    playerStats
                );
            });

            // Convert to array and sort
            const leaderboardArray = Array.from(playerStats.values())
                .sort((a, b) => {
                    // Sort by wins first, then by win rate
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.winRate - a.winRate;
                });

            setLeaderboard(leaderboardArray);
        } catch (error) {
            console.error('Failed to fetch completed battles:', error);
        }
    };

    const processBattlePlayer = (
        player: BattlePlayer,
        isWinner: boolean,
        statsMap: Map<string, LeaderboardEntry>
    ) => {
        const existing = statsMap.get(player.name);

        if (existing) {
            existing.totalBattles += 1;
            existing.totalScore += player.score;
            if (isWinner) existing.wins += 1;
            existing.winRate = (existing.wins / existing.totalBattles) * 100;
        } else {
            statsMap.set(player.name, {
                name: player.name,
                wins: isWinner ? 1 : 0,
                totalBattles: 1,
                totalScore: player.score,
                winRate: isWinner ? 100 : 0
            });
        }
    };

    const getRankBadgeClass = (index: number) => {
        if (index === 0) return 'rank-badge rank-1';
        if (index === 1) return 'rank-badge rank-2';
        if (index === 2) return 'rank-badge rank-3';
        return 'rank-badge rank-default';
    };

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <div>
                    <h3 className="leaderboard-title">
                        <GiTrophyCup style={{ color: '#fbbf24' }} />
                        Battle Leaderboard
                    </h3>
                    <p className="leaderboard-subtitle">
                        Top players ranked by wins and performance
                    </p>
                </div>
            </div>

            {leaderboard.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <GiCrossedSwords />
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No battles completed yet</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Complete battles to see the leaderboard</p>
                </div>
            ) : (
                <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => (
                        <div key={entry.name} className="leaderboard-item">
                            <div className={getRankBadgeClass(index)}>
                                {index < 3 ? (
                                    index === 0 ? <FaCrown /> : `#${index + 1}`
                                ) : (
                                    `#${index + 1}`
                                )}
                            </div>

                            <div className="player-info">
                                <div className="player-name">{entry.name}</div>
                                <div className="player-meta">
                                    <span>{entry.totalBattles} battles</span>
                                    <span>•</span>
                                    <span>{entry.winRate.toFixed(0)}% win rate</span>
                                </div>
                            </div>

                            <div className="battle-stats">
                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: '#10b981' }}>
                                        {entry.wins}
                                    </div>
                                    <div className="stat-label">Wins</div>
                                </div>

                                <div className="stat-item">
                                    <div className="stat-value" style={{ color: '#fbbf24' }}>
                                        {entry.totalScore}
                                    </div>
                                    <div className="stat-label">Score</div>
                                </div>
                            </div>

                            {index === 0 && (
                                <div className="winner-badge">
                                    Champion
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BattleLeaderboard;
