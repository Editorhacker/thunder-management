import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaChevronRight, FaChevronLeft, FaCalendarAlt, FaPlus, FaTrash } from 'react-icons/fa';
import { FaPlaystation, FaDesktop, FaVrCardboard, FaGamepad } from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import BookingModal from './BookingModal';
import ConfirmationModal from './ConfirmationModal';
import './UpcomingBookings.css';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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
  const { user } = useAuth();

  // Delete Modal State
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const processingRef = useRef<Set<string>>(new Set());

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
      const res = await axios.get('https://thunder-management.onrender.com/api/sessions/upcoming');
      setBookings(res.data);
    } catch (error) {
      console.error('Failed to load upcoming bookings', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for bookings that should start now
  useEffect(() => {
    const checkStartingBookings = async () => {
      const now = Date.now();

      for (const booking of bookings) {
        const startTime = new Date(booking.time).getTime();
        // If start time is reached or passed (within a reasonable window, e.g., 1 min late is fine)
        if (startTime <= now && !processingRef.current.has(booking.id)) {
          // Mark as processing to prevent double-firing
          processingRef.current.add(booking.id);

          console.log(`Auto-starting booking ${booking.id} - ${booking.name}`);

          try {
            // Call backend to convert booking to session
            await axios.post(`https://thunder-management.onrender.com/api/sessions/start-booking/${booking.id}`);
            // Refresh list to remove it
            fetchBookings();
          } catch (error) {
            console.error(`Failed to auto-start booking ${booking.id}`, error);
            processingRef.current.delete(booking.id); // Retry next tick if failed
          }
        }
      }
    };

    if (bookings.length > 0) {
      checkStartingBookings();
    }
  }, [currentTime, bookings]);

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteData({ isOpen: true, id, name });
  };

  const { showToast } = useToast();

  const confirmDeleteBooking = async () => {
    if (!deleteData) return;

    try {
      await axios.delete(`https://thunder-management.onrender.com/api/sessions/booking/${deleteData.id}`, {
        data: {
          deletedBy: user?.role === 'owner' ? 'Owner' : 'Employee',
          deletedByName: user?.username || 'Unknown'
        }
      });
      fetchBookings(); // Refresh list
      setDeleteData(null); // Close modal
      showToast(`${deleteData.name}'s booking cancelled`, 'success');
    } catch (error) {
      console.error('Error deleting booking:', error);
      showToast('Failed to cancel booking', 'error');
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

  return (
    <section className="upcoming-bookings-container">
      <div className="bookings-header">
        <div className="bookings-header-left">
          <h3 className="bookings-title">
            <FaCalendarAlt className="icon-blue" />
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
            const timeDiff = new Date(booking.time).getTime() - currentTime;
            const isRedUrgent = timeDiff > 0 && timeDiff <= 30 * 60 * 1000; // 30 mins
            const isBlueUrgent = timeDiff > 30 * 60 * 1000 && timeDiff <= 90 * 60 * 1000; // 1.5 hours

            return (
              <motion.div
                key={booking.id}
                className={`booking-card-premium ${isRedUrgent ? 'glow-red' : isBlueUrgent ? 'glow-blue' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >

                {/* Header (Status + Delete) */}
                <div className="booking-card-header">
                  <div className={`booking-status-badge ${status.class}`}>
                    {status.label}
                  </div>
                  <button
                    className="delete-booking-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(booking.id, booking.name);
                    }}
                    title="Cancel"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>

                {/* Main Content (Time) */}
                <div className="booking-main-content">
                  <div className="time-group">
                    <span className="time-big">{formatTime(booking.time)}</span>
                  </div>

                  <div className="countdown-wrapper">
                    {timeUntil}
                  </div>
                </div>

                {/* Footer (Customer + Devices) */}
                <div className="booking-footer-panel">
                  <div className="customer-info">
                    <span className="customer-name">{booking.name}</span>
                    <span className="customer-meta">
                      {booking.peopleCount ? `${booking.peopleCount}P` : ''}
                      {booking.duration ? ` • ${booking.duration}H` : ''}
                    </span>
                  </div>

                  <div className="device-list">
                    {booking.devices.map((dev, i) => (
                      <div key={i} className={`device-tech-pill ${dev.type}`} title={dev.type}>
                        {getDeviceIcon(dev.type)}
                        {dev.id && <span className="dev-id">#{dev.id}</span>}
                      </div>
                    ))}
                  </div>
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

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={!!deleteData?.isOpen}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDeleteBooking}
        title="Cancel Booking?"
        message={`Are you sure you want to cancel the booking for ${deleteData?.name}? This action cannot be undone.`}
        isDanger={true}
      />
    </section>
  );
};

export default UpcomingBookings;
