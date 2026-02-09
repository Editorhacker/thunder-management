import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlaystation, FaDesktop, FaVrCardboard, FaClock, FaGamepad } from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import UpdateSessionModal from './UpdateSessionModal';
import './ActiveSessions.css';
import { io } from 'socket.io-client';
import { isFunNightTime, isNormalHourTime } from '../../utils/pricing';

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


const socket = io('http://localhost:5000', {
    transports: ['websocket']
});


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
     Initial fetch (ONLY ONCE)
  --------------------------------------- */
  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sessions/active');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load active sessions', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------
     Socket listeners
  --------------------------------------- */
  useEffect(() => {
    fetchSessions();

    socket.on('session:started', (session: ActiveSession) => {
      setSessions(prev => [...prev, session]);
    });

    socket.on('session:completed', ({ sessionId }) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    });

    socket.on('session:updated', async () => {
      // Rare event → safe to refresh list once
      const res = await axios.get('http://localhost:5000/api/sessions/active');
      setSessions(res.data);
    });

    socket.on('booking:converted', async () => {
      // booking → session happened
      const res = await axios.get('http://localhost:5000/api/sessions/active');
      setSessions(res.data);
    });

    return () => {
      socket.off('session:started');
      socket.off('session:completed');
      socket.off('session:updated');
      socket.off('booking:converted');
    };
  }, []);

  /* ---------------------------------------
     Timer for UI countdown ONLY
  --------------------------------------- */
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isFunNight = isFunNightTime();
  const isNormalHour = isNormalHourTime();

  /* ---------------------------------------
     Remaining time helper
  --------------------------------------- */
  const getSessionDetails = (session: ActiveSession) => {
    const start = new Date(session.startTime).getTime();
    const totalDurationMs = session.duration * 60 * 60 * 1000;
    const end = start + totalDurationMs;

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
        <h3 className="section-title-lg">Active Sessions
          {isFunNight && <span style={{ color: '#ec4899', fontSize: '0.6em', border: '1px solid #ec4899', padding: '2px 8px', borderRadius: '12px', marginLeft: 8, verticalAlign: 'middle' }}>🌙 Fun Night</span>}
          {isNormalHour && <span style={{ color: '#3b82f6', fontSize: '0.6em', border: '1px solid #3b82f6', padding: '2px 8px', borderRadius: '12px', marginLeft: 8, verticalAlign: 'middle' }}>☀️ Normal Hour</span>}
        </h3>
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
