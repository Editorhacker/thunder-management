import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaClock, FaChevronRight, FaChevronLeft, FaCalendarAlt, FaPlus, FaUser, FaUsers, FaTrash } from 'react-icons/fa';
import { FaPlaystation, FaDesktop, FaVrCardboard, FaGamepad } from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import { MdAccessTime } from 'react-icons/md';
import BookingModal from './BookingModal';
import './UpcomingBookings.css';

type DeviceType = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

interface BookingDevice {
  type: DeviceType;
  id: number | null;
}

interface Booking {
  id: string;
  name: string;
  time: string;
  endTime?: string;
  devices: BookingDevice[];
  peopleCount?: number;
  duration?: number;
}

const UpcomingBookings = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sessions/upcoming');
      setBookings(res.data);
    } catch (error) {
      console.error('Failed to load upcoming bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to cancel the booking for ${name}?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/sessions/booking/${id}`);
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking. Please try again.');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Get device icon
  const getDeviceIcon = (device: DeviceType) => {
    switch (device) {
      case 'ps': return <FaPlaystation className="device-chip-icon" />;
      case 'pc': return <FaDesktop className="device-chip-icon" />;
      case 'vr': return <FaVrCardboard className="device-chip-icon" />;
      case 'wheel': return <GiSteeringWheel className="device-chip-icon" />;
      case 'metabat': return <GiCricketBat className="device-chip-icon" />;
      default: return <FaGamepad className="device-chip-icon" />;
    }
  };



  // Calculate time until booking
  const getTimeUntil = (bookingTime: string) => {
    const bookingDate = new Date(bookingTime);
    const diff = bookingDate.getTime() - currentTime;

    if (diff < 0) return 'Starting now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes}m`;
    if (hours < 24) return `${hours}h ${minutes}m`;

    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Get booking status
  const getBookingStatus = (bookingTime: string) => {
    const bookingDate = new Date(bookingTime);
    const diff = bookingDate.getTime() - currentTime;

    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return { label: 'Starting Soon', class: 'status-soon' };
    if (hours < 6) return { label: 'Today', class: 'status-today' };
    return { label: 'Upcoming', class: 'status-later' };
  };

  // Format time display
  const formatTime = (timeString: string, endTimeString?: string) => {
    const start = new Date(timeString);
    const startStr = start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (endTimeString) {
      const end = new Date(endTimeString);
      const endStr = end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `${startStr} - ${endStr}`;
    }

    return startStr;
  };

  // Format date display
  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="upcoming-bookings-container">
      <div className="bookings-header">
        <div className="bookings-header-left">
          <h3 className="bookings-title">
            <FaCalendarAlt style={{ color: '#3b82f6' }} />
            Upcoming Bookings
          </h3>
          <p className="bookings-subtitle">
            {bookings.length} scheduled sessions
          </p>
        </div>

        <div className="bookings-actions">
          <button className="scroll-btn" onClick={() => scroll('left')}>
            <FaChevronLeft />
          </button>
          <button className="scroll-btn" onClick={() => scroll('right')}>
            <FaChevronRight />
          </button>

          <button className="new-booking-btn" onClick={() => setShowModal(true)}>
            <FaPlus />
            New Booking
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-bookings-state">
          <div className="empty-icon">
            <FaCalendarAlt />
          </div>
          <h4 className="empty-title">No Upcoming Bookings</h4>
          <p className="empty-subtitle">
            Schedule a new booking to see it here
          </p>

        </div>
      ) : (
        <div className="bookings-timeline" ref={scrollRef}>
          {bookings.map((booking, index) => {
            const status = getBookingStatus(booking.time);
            const timeUntil = getTimeUntil(booking.time);

            return (
              <motion.div
                key={booking.id}
                className="booking-card-premium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="booking-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div className={`booking-status-badge ${status.class}`}>
                    {status.label}
                  </div>
                  <button
                    className="delete-booking-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBooking(booking.id, booking.name);
                    }}
                    title="Cancel Booking"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#ef4444',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>

                <div className="booking-time-section">
                  <div className="booking-time-display">
                    <div className="time-icon-wrapper">
                      <MdAccessTime />
                    </div>
                    <div className="time-text">
                      <span className="time-value">{formatTime(booking.time, booking.endTime)}</span>
                      <span className="time-label">{formatDate(booking.time)}</span>
                    </div>
                  </div>

                  <div className="countdown-timer">
                    <FaClock style={{ fontSize: '0.75rem' }} />
                    <span>Starts in</span>
                    <span className="countdown-value">{timeUntil}</span>
                  </div>
                </div>

                <div className="booking-customer-section">
                  <div className="customer-name">{booking.name}</div>
                  <div className="customer-meta">
                    {booking.peopleCount && (
                      <div className="meta-item">
                        {booking.peopleCount === 1 ? <FaUser /> : <FaUsers />}
                        <span>{booking.peopleCount} {booking.peopleCount === 1 ? 'person' : 'people'}</span>
                      </div>
                    )}
                    {booking.duration && booking.duration > 0 && (
                      <>
                        <span>•</span>
                        <div className="meta-item">
                          <FaClock />
                          <span>{booking.duration}h session</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="booking-devices-section">
                  {booking.devices.map((dev, i) => (
                    <div key={i} className={`device-tag ${dev.type}`}>
                      {getDeviceIcon(dev.type)}
                      <span style={{ textTransform: 'uppercase' }}>
                        {dev.type} {dev.id ? `#${dev.id}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BookingModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchBookings();
          }}
        />
      )}
    </section>
  );
};

export default UpcomingBookings;
