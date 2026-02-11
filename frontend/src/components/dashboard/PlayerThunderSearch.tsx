import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { FaBolt, FaSearch, FaTimes, FaUser, FaPhoneAlt, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './PlayerThunderSearch.css';

interface PlayerResult {
    name: string;
    phone: string;
    thunderCoins: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

const PlayerThunderSearchModal = ({ open, onClose }: Props) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [result, setResult] = useState<PlayerResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSearch = async () => {
        if (!name.trim() || !phone.trim()) {
            setError('Both name and phone are required');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await axios.get(
                `https://thunder-management.vercel.app//api/battles/thunder-player`,
                {
                    params: { name, phone }
                }
            );
            setResult(res.data);
        } catch {
            setError('Player not found in our system');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose} // Close on backdrop click
                >
                    <motion.div
                        className="modal-card"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        onClick={(e) => e.stopPropagation()} // Prevent close on card click
                    >
                        {/* Header */}
                        <div className="modal-header">
                            <div className="modal-title">
                                <FaBolt size={24} />
                                <span>Player Search</span>
                            </div>
                            <button className="close-btn" onClick={onClose} title="Close">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="input-group">
                                <input
                                    className="modal-input"
                                    placeholder="Player Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <FaUser className="input-icon" size={14} />
                            </div>

                            <div className="input-group">
                                <input
                                    className="modal-input"
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    type="tel"
                                />
                                <FaPhoneAlt className="input-icon" size={14} />
                            </div>

                            <motion.button
                                className="modal-search-btn"
                                onClick={handleSearch}
                                disabled={loading || !name || !phone}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    >
                                        <FaSearch />
                                    </motion.div>
                                ) : (
                                    <>
                                        <FaSearch /> Search Player
                                    </>
                                )}
                            </motion.button>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        className="error-msg"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <FaExclamationCircle /> {error}
                                    </motion.div>
                                )}

                                {result && (
                                    <motion.div
                                        className="result-card"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <div className="result-avatar">
                                            <FaUser size={24} color="#facc15" />
                                        </div>
                                        <div className="result-name">{result.name}</div>
                                        <div className="result-phone">{result.phone}</div>

                                        <div className="result-coins-wrapper">
                                            <div className="coin-label">Available Balance</div>
                                            <div className="result-coins">
                                                <FaBolt />
                                                <motion.span
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    {result.thunderCoins}
                                                </motion.span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PlayerThunderSearchModal;
