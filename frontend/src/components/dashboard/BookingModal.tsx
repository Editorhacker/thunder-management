import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlaystation,
  FaDesktop,
  FaVrCardboard,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaPhone
} from 'react-icons/fa';
import { GiSteeringWheel, GiCricketBat } from 'react-icons/gi';
import axios from 'axios';
import './BookingModal.css';

import DeviceDropdown from './DeviceDropdown'; // Imported shared component
import { calculateSessionPrice } from '../../utils/pricing';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

// Device Dropdown moved to separate file

type DeviceType = 'ps' | 'pc' | 'vr' | 'wheel' | 'metabat';

interface DeviceInfo {
  key: DeviceType;
  label: string;
  icon: React.ReactNode;
}

const DEVICES: DeviceInfo[] = [
  { key: 'ps', label: 'PlayStation 5', icon: <FaPlaystation /> },
  { key: 'pc', label: 'PC Gaming', icon: <FaDesktop /> },
  { key: 'vr', label: 'VR Station', icon: <FaVrCardboard /> },
  { key: 'wheel', label: 'Racing Wheel', icon: <GiSteeringWheel /> },
  { key: 'metabat', label: 'Meta Bat', icon: <GiCricketBat /> }
];

const BookingModal = ({ onClose, onSuccess }: Props) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    customerName: '',
    contactNumber: '',
    peopleCount: 1,
    bookingDate: '',
    bookingTime: '',
    bookingEndTime: '',
    devices: {
      ps: [],
      pc: [],
      vr: [],
      wheel: [],
      metabat: []
    } as Record<string, number[]>
  });

  // State for time-specific availability
  const [timeBasedAvailability, setTimeBasedAvailability] = useState<{
    limits: Record<string, number>;
    occupied: { [key: string]: number[] };
  }>({
    limits: { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 },
    occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
  });

  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Fetch availability for specific date/time
  const fetchTimeBasedAvailability = async () => {
    if (!form.bookingDate || !form.bookingTime || !form.bookingEndTime) {
      return;
    }

    setLoadingAvailability(true);
    try {
      const startDateTime = new Date(`${form.bookingDate}T${form.bookingTime}`);
      const endDateTime = new Date(`${form.bookingDate}T${form.bookingEndTime}`);

      const res = await axios.get(
        'https://thunder-management.vercel.app//api/sessions/availability-for-time',
        {
          params: {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString()
          }
        }
      );
      setTimeBasedAvailability(res.data);
    } catch (e) {
      console.error("Failed to fetch time-based availability", e);
      // Fallback
      setTimeBasedAvailability({
        limits: { ps: 6, pc: 5, vr: 1, wheel: 1, metabat: 1 },
        occupied: { ps: [], pc: [], vr: [], wheel: [], metabat: [] }
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Fetch availability when date/time changes
  useEffect(() => {
    if (currentStep === 3) {
      fetchTimeBasedAvailability();
    }
  }, [currentStep]);

  const updateDevice = (key: string, value: number[]) => {
    // Check if adding devices exceeds people count
    const currentDeviceCount = getTotalDevices();
    const newDeviceTypeCount = value.length;
    const oldDeviceTypeCount = form.devices[key].length;
    const diff = newDeviceTypeCount - oldDeviceTypeCount;

    if (diff > 0 && (currentDeviceCount + diff) > form.peopleCount) {
      alert(`You cannot select more devices than the number of people (${form.peopleCount}).`);
      return;
    }

    setForm(prev => ({
      ...prev,
      devices: {
        ...prev.devices,
        [key]: value
      }
    }));
  };

  const getTotalDevices = () => {
    return Object.values(form.devices).reduce((sum, list) => sum + list.length, 0);
  };

  const getSelectedDevices = () => {
    return Object.entries(form.devices)
      .filter(([_, list]) => list.length > 0)
      .map(([key, list]) => {
        const device = DEVICES.find(d => d.key === key);
        return { ...device, count: list.length, ids: list };
      });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.customerName.trim().length > 0 &&
          form.contactNumber.length === 10 &&
          form.peopleCount > 0;
      case 2:
        return form.bookingDate && form.bookingTime && form.bookingEndTime;
      case 3:
        return getTotalDevices() > 0 && getTotalDevices() <= form.peopleCount;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createBooking = async () => {
    if (!canProceed()) return;

    try {
      const bookingDateTime = new Date(`${form.bookingDate}T${form.bookingTime}`);
      const endDateTime = new Date(`${form.bookingDate}T${form.bookingEndTime}`);

      await axios.post('https://thunder-management.vercel.app//api/sessions/booking', {
        customerName: form.customerName,
        contactNumber: form.contactNumber,
        peopleCount: form.peopleCount,
        bookingTime: bookingDateTime.toISOString(),
        bookingEndTime: endDateTime.toISOString(),
        devices: form.devices
      });

      alert('✅ Booking created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create booking.');
    }
  };

  // ------------------- Price Calculation Helper -------------------
  const getEstimatedPrice = () => {
    if (!form.bookingDate || !form.bookingTime || !form.bookingEndTime) return 0;

    const start = new Date(`${form.bookingDate}T${form.bookingTime}`);
    const end = new Date(`${form.bookingDate}T${form.bookingEndTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (duration <= 0) return 0;

    return calculateSessionPrice(
      duration,
      form.peopleCount,
      form.devices, // Expects Record<string, number[]>
      start // Use booking start time for pricing logic (Normal vs Fun)
    );
  };


  const getFormattedSummary = () => {
    const start = new Date(`${form.bookingDate}T${form.bookingTime}`);
    const end = new Date(`${form.bookingDate}T${form.bookingEndTime}`);

    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeConfig: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const startTimeStr = start.toLocaleTimeString('en-US', timeConfig);
    const endTimeStr = end.toLocaleTimeString('en-US', timeConfig);

    return `${dateStr} | ${startTimeStr} - ${endTimeStr}`;
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <motion.div
        className="booking-modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        {/* Header */}
        <div className="booking-modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>

          <div className="modal-title-section">
            <div className="modal-icon-wrapper">
              <FaCalendarAlt />
            </div>
            <div className="modal-title-text">
              <h2>New Booking</h2>
              <p>Step {currentStep} of 3 - {
                currentStep === 1 ? 'Customer Details' :
                  currentStep === 2 ? 'Date & Time' :
                    'Select Devices'
              }</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="booking-steps">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`step-indicator ${step === currentStep ? 'active' :
                  step < currentStep ? 'completed' : ''
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="booking-modal-body">
          <AnimatePresence mode="wait">
            {/* STEP 1: Customer Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                className="step-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="step-title">Customer Information</h3>
                <p className="step-description">
                  Let's start with the customer's details
                </p>

                <div className="form-field">
                  <label className="field-label">
                    <FaUser style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Enter customer name..."
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaPhone style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    className="field-input"
                    placeholder="10-digit mobile number..."
                    maxLength={10}
                    value={form.contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setForm({ ...form, contactNumber: val });
                    }}
                  />
                  {form.contactNumber.length > 0 && form.contactNumber.length < 10 && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                      Please enter a 10-digit number
                    </span>
                  )}
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaUser style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Number of People
                  </label>
                  <input
                    type="number"
                    className="field-input"
                    placeholder="How many people?"
                    min={1}
                    value={form.peopleCount}
                    onChange={(e) => setForm({ ...form, peopleCount: Math.max(1, Number(e.target.value)) })}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Date & Time */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                className="step-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="step-title">When do you need it?</h3>
                <p className="step-description">
                  Select the date and time for this booking
                </p>

                <div className="form-field">
                  <label className="field-label">
                    <FaCalendarAlt style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Booking Date
                  </label>
                  <input
                    type="date"
                    className="field-input"
                    value={form.bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  />
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaClock style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="field-input"
                    value={form.bookingTime}
                    onChange={(e) => setForm({ ...form, bookingTime: e.target.value })}
                  />
                </div>

                <div className="form-field" style={{ marginTop: '1.5rem' }}>
                  <label className="field-label">
                    <FaClock style={{ display: 'inline', marginRight: '0.5rem' }} />
                    End Time
                  </label>
                  <input
                    type="time"
                    className="field-input"
                    value={form.bookingEndTime}
                    onChange={(e) => setForm({ ...form, bookingEndTime: e.target.value })}
                  />
                </div>

                {form.bookingDate && form.bookingTime && form.bookingEndTime && (
                  <div className="time-info-card" style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#60a5fa'
                  }}>
                    📅 {getFormattedSummary()}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Device Selection (Time-based Availability) */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                className="step-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="step-title">Select Gaming Devices</h3>
                <p className="step-description">
                  {getTotalDevices() > 0
                    ? `${getTotalDevices()} devices selected`
                    : "Choose from available devices for this time slot"}
                </p>

                {loadingAvailability ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>
                    Loading availability...
                  </div>
                ) : (
                  <div className="devices-dropdown-list">
                    <DeviceDropdown
                      icon={<FaPlaystation />}
                      label="PS5"
                      limit={timeBasedAvailability.limits.ps}
                      value={form.devices.ps}
                      occupied={timeBasedAvailability.occupied.ps || []}
                      onChange={v => updateDevice('ps', v)}
                    />

                    <DeviceDropdown
                      icon={<FaDesktop />}
                      label="PC"
                      limit={timeBasedAvailability.limits.pc}
                      value={form.devices.pc}
                      occupied={timeBasedAvailability.occupied.pc || []}
                      onChange={v => updateDevice('pc', v)}
                    />

                    <DeviceDropdown
                      icon={<FaVrCardboard />}
                      label="VR"
                      limit={timeBasedAvailability.limits.vr}
                      value={form.devices.vr}
                      occupied={timeBasedAvailability.occupied.vr || []}
                      onChange={v => updateDevice('vr', v)}
                    />

                    <DeviceDropdown
                      icon={<GiSteeringWheel />}
                      label="Wheel"
                      limit={timeBasedAvailability.limits.wheel}
                      value={form.devices.wheel}
                      occupied={timeBasedAvailability.occupied.wheel || []}
                      onChange={v => updateDevice('wheel', v)}
                    />

                    <DeviceDropdown
                      icon={<GiCricketBat />}
                      label="MetaBat"
                      limit={timeBasedAvailability.limits.metabat}
                      value={form.devices.metabat}
                      occupied={timeBasedAvailability.occupied.metabat || []}
                      onChange={v => updateDevice('metabat', v)}
                    />
                  </div>
                )}

                {/* Booking Summary */}
                {getTotalDevices() > 0 && (
                  <div className="booking-summary-card">
                    <h4 className="summary-title">Booking Summary</h4>
                    <div className="summary-item">
                      <span className="summary-label">Customer:</span>
                      <span className="summary-value">{form.customerName}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Contact:</span>
                      <span className="summary-value">{form.contactNumber}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">People:</span>
                      <span className="summary-value">{form.peopleCount}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">When:</span>
                      <span className="summary-value">{getFormattedSummary()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Devices:</span>
                      <span className="summary-value">
                        {getSelectedDevices().map(d => `${d?.label} #${d?.ids?.join(', #')}`).join(', ')}
                      </span>
                    </div>
                    <div className="summary-item" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="summary-label">Estimated Cost:</span>
                      <span className="summary-value" style={{ color: '#ec4899', fontWeight: 'bold' }}>
                        ₹{getEstimatedPrice().toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="booking-modal-footer">
          <button
            className="modal-btn secondary"
            onClick={currentStep === 1 ? onClose : handleBack}
          >
            <FaChevronLeft />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button
              className="modal-btn primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <FaChevronRight />
            </button>
          ) : (
            <button
              className="modal-btn confirm"
              onClick={createBooking}
              disabled={!canProceed()}
            >
              <FaCheck />
              Confirm Booking
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
