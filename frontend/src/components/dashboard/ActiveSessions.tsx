import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlaystation, FaDesktop, FaVrCardboard, FaClock, FaGamepad } from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import UpdateSessionModal from './UpdateSessionModal';
import './ActiveSessions.css';

/* ---------------------------------------
   Device Icon Helper
--------------------------------------- */
const DeviceIcon = ({ type }: { type: string }) => {
  const size = 14;
  switch (type) {
    case 'ps': return <FaPlaystation size={size} />;
    case 'pc': return <FaDesktop size={size} />;
    case 'vr': return <FaVrCardboard size={size} />;
    case 'wheel': return <GiSteeringWheel size={size} />;
    case 'metabat': return <GiCricketBat size={size} />;
    default: return <FaGamepad size={size} />;
  }
};

/* ---------------------------------------
   Types
--------------------------------------- */
interface ActiveSession {
  id: string;
  customer: string;
  startTime: string;   // ISO
  duration: number;    // hours
  peopleCount: number;   // 🔥
  price: number;         // 🔥
  paidAmount?: number;
  remainingAmount?: number;

  devices: ('ps' | 'pc' | 'vr' | 'wheel' | 'metabat')[];
  status: string;
}

const ActiveSessions = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);

  const [loading, setLoading] = useState(true);

  /* ---------------------------------------
     Fetch Active Sessions (initial)
  --------------------------------------- */
  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sessions/active');
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to load active sessions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Real-time ticking
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------------------------------
     Auto close & refresh every 30s
  --------------------------------------- */
  useEffect(() => {
    const interval = setInterval(async () => {

      // 1. close expired sessions
      for (const s of sessions) {
        const start = new Date(s.startTime).getTime();
        const end = start + s.duration * 60 * 60 * 1000;

        if (Date.now() > end) {
          await axios.post(
            `http://localhost:5000/api/sessions/complete/${s.id}`
          );
        }
      }

      // 2. reload list
      const res = await axios.get('http://localhost:5000/api/sessions/active');
      setSessions(res.data);

    }, 30000); // every 10 seconds

    return () => clearInterval(interval);
  }, [sessions]);

  /* ---------------------------------------
     Remaining time helper
  --------------------------------------- */
  const getSessionDetails = (session: ActiveSession) => {
    const start = new Date(session.startTime).getTime();
    const totalDurationMs = session.duration * 60 * 60 * 1000;
    const end = start + totalDurationMs;

    // We need currentTime state to make this dynamic, but we can use Date.now() for initial render
    // However, to make it tick we need state. 
    // Wait, the previous full replace included 'currentTime' state. 
    // Since I am editing a chunk, I assume 'currentTime' state is missing from my previous smaller edit?
    // Actually the previous full replace FAILED. So i am editing the OLD file.
    // The OLD file does NOT have currentTime state.
    // So I will use Date.now() but it won't tick every second unless I add state.
    // Let's stick to simple implementation for now to fix the errors.

    const now = currentTime;
    const elapsed = now - start;
    const remaining = end - now;

    const progress = Math.min(100, Math.max(0, (elapsed / totalDurationMs) * 100));
    const isUrgent = remaining < 10 * 60 * 1000; // Less than 10 mins

    let timeText = "Completed";
    if (remaining > 0) {
      const hrs = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);
      timeText = `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
    }

    return { progress, isUrgent, timeText, remaining };
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };


  /* ---------------------------------------
     Render
  --------------------------------------- */
  return (
    <section className="active-sessions-container">

      {/* Header */}
      <div className="sessions-header">
        <h3 className="section-title-lg">Active Sessions</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
            {sessions.length} Players Online
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="sessions-grid-premium">
        {loading && <div style={{ color: '#fff' }}>Loading data...</div>}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <h4>No active sessions</h4>
            <p>The arena is currently empty.</p>
          </div>
        )}

        {!loading && sessions.map((session) => {
          const { progress, isUrgent, timeText } = getSessionDetails(session);

          return (
            <div
              key={session.id}
              className={`session-card-premium ${isUrgent ? 'urgent' : ''}`}
              onClick={() => setSelectedSession(session)}
            >
              {/* Top Stripe */}
              <div className="card-status-stripe" />

              <div className="card-content">
                {/* Header: User */}
                <div className="card-user-header">
                  <div className="user-avatar-glow">
                    {getInitials(session.customer)}
                  </div>
                  <div className="user-info">
                    <h4>{session.customer}</h4>
                    <p>₹{session.remainingAmount} • {session.peopleCount} Player{session.peopleCount > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Big Timer */}
                <div className="timer-display-big">
                  <span className="time-remaining">{timeText}</span>
                  <span className="time-label">Time Remaining</span>
                </div>

                {/* Devices */}
                <div className="devices-mini-grid">
                  {Array.from(new Set(session.devices)).map((dev, i) => (
                    <div key={i} className={`device-tag ${dev}`}>
                      <DeviceIcon type={dev} />
                      <span style={{ textTransform: 'uppercase' }}>{dev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar (Attached to bottom) */}
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedSession && (
        <UpdateSessionModal
          session={selectedSession}
          onClose={() => {
            setSelectedSession(null);
            fetchSessions(); // Refresh after update
          }}
        />
      )}
    </section>
  );
};

export default ActiveSessions;
