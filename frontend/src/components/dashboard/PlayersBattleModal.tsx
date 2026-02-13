import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCrown, FaTimes, FaGamepad } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import './PlayersBattle.css';

interface PlayerInfo {
    name: string;
    phone: string;
    age: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const PlayersBattleModal = ({ isOpen, onClose }: Props) => {
    const [crownHolder, setCrownHolder] = useState<PlayerInfo>({ name: '', phone: '', age: '' });
    const [challenger, setChallenger] = useState<PlayerInfo>({ name: '', phone: '', age: '' });

    const handleInputChange = (
        type: 'crown' | 'challenger',
        field: keyof PlayerInfo,
        value: string
    ) => {
        if (type === 'crown') {
            setCrownHolder(prev => ({ ...prev, [field]: value }));
        } else {
            setChallenger(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async () => {
        if (!crownHolder.name || !challenger.name) {
            alert("Please enter player names!");
            return;
        }

        try {
            await axios.post('https://thunder-management.onrender.com/api/battles/start', {
                crownHolder,
                challenger
            });

            alert('Battle Started! ⚔️');
            onClose();
            // Reset
            setCrownHolder({ name: '', phone: '', age: '' });
            setChallenger({ name: '', phone: '', age: '' });

            // Trigger refresh (global event or context would be better, but quick hack: reload window or rely on polling)
            // Ideally, ActiveBattles should be polling.
        } catch (error) {
            console.error(error);
            alert("Failed to start battle");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="battle-modal-backdrop">
                    <motion.div
                        className="battle-modal-container"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                    >
                        <div className="battle-modal-header">
                            <h2 className="battle-modal-title">
                                <GiCrossedSwords style={{ marginRight: '10px', verticalAlign: 'middle', color: '#ef4444' }} />
                                New Battle Registration
                            </h2>
                            <button className="close-btn" onClick={onClose}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="battle-form-content custom-scrollbar">
                            {/* Crown Holder Section */}
                            <div className="form-section crown-holder-section">
                                <h3 className="section-title" style={{ color: '#eab308' }}>
                                    <FaCrown /> Crown Holder
                                </h3>

                                <div className="input-group">
                                    <label className="input-label">Player Name</label>
                                    <div className="relative">
                                        <input
                                            className="battle-input"
                                            placeholder="Enter Name"
                                            value={crownHolder.name}
                                            onChange={(e) => handleInputChange('crown', 'name', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Phone Number</label>
                                    <div className="relative">
                                        <input
                                            className="battle-input"
                                            placeholder="Enter Phone"
                                            type="tel"
                                            value={crownHolder.phone}
                                            onChange={(e) => handleInputChange('crown', 'phone', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Age</label>
                                    <input
                                        className="battle-input"
                                        placeholder="Enter Age"
                                        type="number"
                                        value={crownHolder.age}
                                        onChange={(e) => handleInputChange('crown', 'age', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* VS Badge */}
                            <div className="vs-badge">
                                VS
                            </div>

                            {/* Challenger Section */}
                            <div className="form-section challenger-section">
                                <h3 className="section-title" style={{ color: '#3b82f6' }}>
                                    <FaGamepad /> Challenger
                                </h3>

                                <div className="input-group">
                                    <label className="input-label">Player Name</label>
                                    <input
                                        className="battle-input"
                                        placeholder="Enter Name"
                                        value={challenger.name}
                                        onChange={(e) => handleInputChange('challenger', 'name', e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Phone Number</label>
                                    <input
                                        className="battle-input"
                                        placeholder="Enter Phone"
                                        type="tel"
                                        value={challenger.phone}
                                        onChange={(e) => handleInputChange('challenger', 'phone', e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Age</label>
                                    <input
                                        className="battle-input"
                                        placeholder="Enter Age"
                                        type="number"
                                        value={challenger.age}
                                        onChange={(e) => handleInputChange('challenger', 'age', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="battle-actions">
                            <button className="cancel-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="confirm-battle-btn" onClick={handleSubmit}>
                                Start Battle
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PlayersBattleModal;
