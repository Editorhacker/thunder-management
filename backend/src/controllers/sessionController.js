const { db } = require('../config/firebase');
const deviceLimits = require("../config/deviceLimit");
const { calculateSessionPrice } = require('../utils/pricing');

// Helper to transform device counts object to array of strings for frontend
const transformDevicesToArray = (deviceCounts) => {
    const devices = [];
    if (!deviceCounts) return devices;

    // devices: { ps: 2, pc: 1 } -> ['ps', 'ps', 'pc']
    Object.entries(deviceCounts).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            devices.push(type);
        }
    });
    return devices;
};

const getDeviceAvailability = async (req, res) => {
    try {
        const snapshot = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .get();

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        snapshot.forEach(doc => {
            const devices = doc.data().devices || {};
            // devices: { ps: 5 } means PS Machine #5 is used.
            Object.keys(devices).forEach(k => {
                const machineId = devices[k];
                if (machineId > 0 && occupied[k]) {
                    occupied[k].push(machineId);
                }
            });
        });

        res.status(200).json({
            limits: deviceLimits,
            occupied
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Availability error' });
    }
};


const createSession = async (req, res) => {
    try {
        const {
            customerName, contactNumber, duration,
            peopleCount, snacks, devices, price
        } = req.body;

        // 1. Get currently occupied IDs
        const snapshot = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .get();

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        snapshot.forEach(doc => {
            const d = doc.data().devices || {};
            Object.keys(d).forEach(k => {
                const id = d[k];
                if (id > 0 && occupied[k]) occupied[k].push(id);
            });
        });

        // Calculate base price using shared logic
        const durationVal = parseFloat(duration) || 1;
        const peopleVal = parseInt(peopleCount) || 1;
        const devicesVal = devices || {};

        const basePrice = calculateSessionPrice(
            durationVal,
            peopleVal,
            devicesVal,
            new Date()
        );

        // Use the price sent from frontend (which includes snacks) or fallback to calculated base
        const finalPrice = price ? parseFloat(price) : basePrice;

        // 2. Validate availability (Check if ID is taken)
        for (const key in devices) {
            const requestedId = devices[key];
            if (requestedId > 0) {
                // Check if ID is within limits
                if (requestedId > deviceLimits[key]) {
                    return res.status(400).json({
                        message: `${key.toUpperCase()} #${requestedId} does not exist (Max ${deviceLimits[key]})`
                    });
                }
                // Check if ID is occupied
                if (occupied[key].includes(requestedId)) {
                    return res.status(400).json({
                        message: `${key.toUpperCase()} #${requestedId} is currently occupied`
                    });
                }
            }
        }

        // 3. Create session
        const newSession = {
            customerName,
            contactNumber,
            duration: durationVal,
            peopleCount: peopleVal,
            snacks: snacks || '',
            devices: devices || {}, // { ps: 5 }
            price: finalPrice,
            status: 'active',
            startTime: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };


        const docRef = await db.collection('sessions').add(newSession);

        global.io.emit('session:started', {
  id: docRef.id,
  customer: customerName,
  startTime: newSession.startTime,
  duration: newSession.duration,
  peopleCount: newSession.peopleCount,
  price: newSession.price,
  remainingAmount: newSession.remainingAmount,
  devices: transformDevicesToArray(newSession.devices),
  status: 'active'
});

        res.status(201).json({
            message: 'Session started successfully',
            sessionId: docRef.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error starting session' });
    }
};

const getActiveSessions = async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        const snapshot = await db.collection('sessions')
            .where('status', '==', 'active')
            .get();

        const sessions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Transform for frontend
            // Frontend expects: { id, customer, startTime, devices: ['ps', 'ps'], status }

            // Basic formatting of time (just showing time part for now or full string)
            const startDate = new Date(data.startTime);
            const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            sessions.push({
                id: doc.id,
                customer: data.customerName,
                startTime: data.startTime,   // ISO string
                duration: data.duration,     // hours
                peopleCount: data.peopleCount,   // 🔥
                price: data.price,               // 🔥
                paidAmount: data.paidAmount || 0,
                remainingAmount: data.remainingAmount ?? data.price,
                devices: transformDevicesToArray(data.devices),
                status: data.status
            });

        });

        res.status(200).json(sessions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};

const createBooking = async (req, res) => {
    // Similar to session but with a 'bookingTime'
    try {
        const { customerName, bookingTime, bookingEndTime, devices, peopleCount } = req.body;
        // bookingTime expected ISO string

        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        const newBooking = {
            customerName,
            bookingTime,
            bookingEndTime: bookingEndTime || null,
            peopleCount: peopleCount || 1,
            devices: devices || {}, // { ps: 1 ... }
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('bookings').add(newBooking);
        res.status(201).json({ message: 'Booking created', bookingId: docRef.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating booking' });
    }
};

const getUpcomingBookings = async (req, res) => {
    try {
        const snapshot = await db
            .collection('bookings')
            .where('status', '==', 'upcoming')
            .orderBy('bookingTime', 'asc')
            .get();

        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();

            // Ensure we handle both Firestore Timestamp and ISO String
            const bookingDate = data.bookingTime?.toDate
                ? data.bookingTime.toDate()
                : new Date(data.bookingTime);

            const endDate = data.bookingEndTime
                ? (data.bookingEndTime.toDate ? data.bookingEndTime.toDate() : new Date(data.bookingEndTime))
                : null;

            // Calculate duration in hours
            let duration = 0;
            if (endDate) {
                duration = (endDate - bookingDate) / (1000 * 60 * 60);
            }

            return {
                id: doc.id,
                name: data.customerName,
                time: bookingDate.toISOString(), // Start time
                endTime: endDate ? endDate.toISOString() : null,
                duration: duration > 0 ? parseFloat(duration.toFixed(1)) : 0,
                devices: transformDevicesToArray(data.devices || {})
            };
        });

        return res.status(200).json(bookings);

    } catch (error) {
        console.error('❌ getUpcomingBookings error:', error);
        return res.status(500).json({
            message: 'Error fetching bookings'
        });
    }
};

// Get device availability for a specific time range
const getDeviceAvailabilityForTime = async (req, res) => {
    try {
        const { startTime, endTime } = req.query;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: 'startTime and endTime are required' });
        }

        const requestStart = new Date(startTime);
        const requestEnd = new Date(endTime);

        // Define device limits
        const LIMITS = {
            ps: 5,
            pc: 10,
            vr: 3,
            wheel: 2,
            metabat: 4
        };

        // Initialize occupied devices
        const occupied = {
            ps: [],
            pc: [],
            vr: [],
            wheel: [],
            metabat: []
        };

        // Check active sessions that overlap with requested time
        const activeSessions = await db.collection('sessions')
            .where('status', '==', 'active')
            .get();

        activeSessions.forEach(doc => {
            const session = doc.data();
            const sessionStart = new Date(session.startTime);
            const sessionDuration = session.duration || 1; // hours
            const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 60 * 1000);

            // Check if session overlaps with requested time
            const overlaps = sessionStart < requestEnd && sessionEnd > requestStart;

            if (overlaps && session.devices) {
                Object.keys(session.devices).forEach(deviceKey => {
                    const deviceNum = session.devices[deviceKey];
                    if (deviceNum > 0 && !occupied[deviceKey].includes(deviceNum)) {
                        occupied[deviceKey].push(deviceNum);
                    }
                });
            }
        });

        // Check upcoming bookings that overlap with requested time
        const upcomingBookings = await db.collection('bookings')
            .where('status', '==', 'upcoming')
            .get();

        upcomingBookings.forEach(doc => {
            const booking = doc.data();
            const bookingStart = booking.bookingTime?.toDate
                ? booking.bookingTime.toDate()
                : new Date(booking.bookingTime);

            const bookingEnd = booking.bookingEndTime?.toDate
                ? booking.bookingEndTime.toDate()
                : new Date(booking.bookingEndTime);

            // Check if booking overlaps with requested time
            const overlaps = bookingStart < requestEnd && bookingEnd > requestStart;

            if (overlaps && booking.devices) {
                Object.keys(booking.devices).forEach(deviceKey => {
                    const deviceNum = booking.devices[deviceKey];
                    if (deviceNum > 0 && !occupied[deviceKey].includes(deviceNum)) {
                        occupied[deviceKey].push(deviceNum);
                    }
                });
            }
        });

        console.log(`📊 Availability for ${startTime} to ${endTime}:`, {
            limits: LIMITS,
            occupied
        });

        return res.status(200).json({
            limits: LIMITS,
            occupied
        });

    } catch (error) {
        console.error('❌ getDeviceAvailabilityForTime error:', error);
        return res.status(500).json({
            message: 'Error fetching time-based availability'
        });
    }
};

const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { extraTime, extraPrice, newMember, paidNow, payingPeopleNow } = req.body;


        const ref = db.collection('sessions').doc(id);
        const snap = await ref.get();

        if (!snap.exists) {
            return res.status(404).json({ message: "Session not found" });
        }

        const data = snap.data();

        // ---- Option A ledger logic ----
        const totalPrice = data.price + (extraPrice || 0);

        const alreadyPaidAmount = data.paidAmount || 0;
        const alreadyPaidPeople = data.paidPeople || 0;

        const paid = alreadyPaidAmount + (paidNow || 0);
        const newPaidPeople = alreadyPaidPeople + (payingPeopleNow || 0);

        const remainingAmount = totalPrice - paid;


        // ---- Safe device merge ----
        let updatedDevices = { ...data.devices };
        let addedPeople = 0;

        if (newMember && newMember.devices) {
            Object.keys(newMember.devices).forEach(k => {
                updatedDevices[k] =
                    (updatedDevices[k] || 0) + (newMember.devices[k] || 0);
            });

            addedPeople = newMember.peopleCount || 0;
        }

        // ---- Final update ----
        await ref.update({
            duration: data.duration + (extraTime || 0),
            peopleCount: data.peopleCount + addedPeople,
            price: totalPrice,
            paidAmount: paid,
            paidPeople: newPaidPeople,   // 👈 ADD
            remainingAmount,
            devices: updatedDevices,
            members: newMember
                ? [...(data.members || []), newMember]
                : data.members || [],
            updatedAt: new Date().toISOString()
        });


        global.io.emit('session:updated', {
  sessionId: id
});


        res.json({ message: "Session updated successfully" });

    } catch (error) {
        console.error("❌ updateSession error:", error);
        res.status(500).json({ message: "Failed to update session" });
    }
};


const completeSession = async (req, res) => {
    try {
        const { id } = req.params;

        await db.collection('sessions').doc(id).update({
            status: 'completed',
            completedAt: new Date().toISOString()
        });


        global.io.emit('session:completed', { sessionId: id });
        res.json({ message: 'Session completed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to complete session' });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('sessions').doc(id).delete();
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ message: 'Failed to delete session' });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('bookings').doc(id).delete();
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Failed to delete booking' });
    }
};

// Convert bookings to active sessions when their time arrives
const convertBookingsToSessions = async (req, res) => {
    try {
        if (!db) {
            console.error('❌ Database not initialized');
            return res ? res.status(500).json({ message: 'Database not initialized' }) : null;
        }

        const now = new Date();
        console.log(`🔄 Checking for bookings to convert at ${now.toISOString()}`);

        // Get all upcoming bookings
        const snapshot = await db
            .collection('bookings')
            .where('status', '==', 'upcoming')
            .get();

        if (snapshot.empty) {
            console.log('📭 No upcoming bookings found');
            return res ? res.status(200).json({ message: 'No bookings to convert', converted: 0 }) : { converted: 0 };
        }

        let convertedCount = 0;
        const conversions = [];

        for (const doc of snapshot.docs) {
            const booking = doc.data();
            const bookingTime = booking.bookingTime?.toDate
                ? booking.bookingTime.toDate()
                : new Date(booking.bookingTime);

            // Check if booking time has arrived (within 1 minute tolerance)
            const timeDiff = now - bookingTime;
            const shouldStart = timeDiff >= 0 && timeDiff <= 60000; // Within 1 minute

            if (shouldStart) {
                console.log(`✅ Converting booking ${doc.id} for ${booking.customerName}`);

                // Calculate duration from start and end times
                let duration = 1; // Default 1 hour
                if (booking.bookingEndTime) {
                    const endTime = booking.bookingEndTime?.toDate
                        ? booking.bookingEndTime.toDate()
                        : new Date(booking.bookingEndTime);
                    duration = (endTime - bookingTime) / (1000 * 60 * 60); // Convert to hours
                }

                // Count total devices for peopleCount estimation
                const deviceCounts = booking.devices || {};
                const totalDevices = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0);
                const estimatedPeople = Math.max(1, totalDevices); // At least 1 person

                // Calculate price using shared logic
                const calculatedPrice = calculateSessionPrice(
                    parseFloat(duration.toFixed(2)),
                    estimatedPeople,
                    booking.devices || {},
                    now // Use current time for pricing rules
                );

                // Create new session
                const newSession = {
                    customerName: booking.customerName,
                    contactNumber: booking.contactNumber || '',
                    duration: parseFloat(duration.toFixed(2)),
                    peopleCount: estimatedPeople,
                    snacks: '',
                    devices: booking.devices || {},
                    price: calculatedPrice,
                    paidAmount: 0,
                    remainingAmount: calculatedPrice,
                    status: 'active',
                    startTime: now.toISOString(),
                    createdAt: now.toISOString(),
                    convertedFromBooking: true,
                    originalBookingId: doc.id
                };

                // Add to sessions collection
                const sessionRef = await db.collection('sessions').add(newSession);
                console.log(`✨ Created session ${sessionRef.id} from booking ${doc.id}`);

                // Delete the booking
                await db.collection('bookings').doc(doc.id).delete();
                console.log(`🗑️ Deleted booking ${doc.id}`);

                convertedCount++;
                conversions.push({
                    bookingId: doc.id,
                    sessionId: sessionRef.id,
                    customerName: booking.customerName
                });
            }
        }

        console.log(`✅ Converted ${convertedCount} booking(s) to active sessions`);
global.io.emit('booking:converted', {
  bookingId: doc.id,
  sessionId: sessionRef.id
});

        return res
            ? res.status(200).json({
                message: `Converted ${convertedCount} booking(s)`,
                converted: convertedCount,
                conversions
            })
            : { converted: convertedCount, conversions };

            
    } catch (error) {
        console.error('❌ Error converting bookings:', error);
        return res
            ? res.status(500).json({ message: 'Error converting bookings' })
            : { error: error.message };
    }
};

// Auto-check endpoint (can be called by cron or frontend polling)
const autoConvertBookings = async () => {
    try {
        return await convertBookingsToSessions(null, null);
    } catch (error) {
        console.error('❌ Auto-convert error:', error);
        return { error: error.message };
    }
};

module.exports = {
    createSession,
    getActiveSessions,
    createBooking,
    getUpcomingBookings,
    getDeviceAvailability,
    getDeviceAvailabilityForTime,
    updateSession,
    completeSession,
    deleteSession,
    deleteBooking,
    convertBookingsToSessions,
    autoConvertBookings
};
