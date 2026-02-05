import { useState } from 'react';
import axios from 'axios';
import { FaBolt, FaSearch, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
                `http://localhost:5000/api/battles/thunder-player`,
                {
                    params: { name, phone }
                }
            );
            setResult(res.data);
        } catch {
            setError('Player not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="modal-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="modal-header">
                            <h3>
                                <FaBolt /> Thunder Coins Search
                            </h3>
                            <button onClick={onClose}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Name input */}
                        <input
                            className="modal-input"
                            placeholder="Player name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        {/* Phone input */}
                        <input
                            className="modal-input"
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        <button
                            className="modal-search-btn"
                            onClick={handleSearch}
                            disabled={loading || !name || !phone}
                        >
                            <FaSearch />
                            {loading ? 'Searching...' : 'Search'}
                        </button>

                        {error && <p className="modal-error">{error}</p>}

                        {result && (
                            <div className="modal-result">
                                <div className="name">{result.name}</div>
                                <div className="phone">{result.phone}</div>
                                <div className="coins">
                                    <FaBolt /> {result.thunderCoins}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PlayerThunderSearchModal;
