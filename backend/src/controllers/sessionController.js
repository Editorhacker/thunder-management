const { db } = require('../config/firebase');
const deviceLimits = require("../config/deviceLimit");
const { calculateSessionPrice } = require('../utils/pricing');
const snackService = require('../services/snackService'); // Import SnackService

// Helper to transform device counts object to array of objects for frontend
const transformDevicesToArray = (deviceData) => {
    const devices = [];
    if (!deviceData) return devices;

    Object.entries(deviceData).forEach(([type, value]) => {
        // Handle array of IDs (New format: { ps: [1, 2] })
        if (Array.isArray(value)) {
            value.forEach(id => devices.push({ type, id }));
        }
        // Handle legacy number count (Old format: { ps: 2 })
        // For legacy, we don't have IDs, so we might just pass type and maybe a placeholder ID or null
        // However, converting legacy data to specific IDs is impossible without data loss, 
        // but for display "PS5" without ID is fine.
        else if (typeof value === 'number') {
            for (let i = 0; i < value; i++) {
                devices.push({ type, id: null }); // No specific ID
            }
        }
    });
    return devices.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return (a.id || 0) - (b.id || 0);
    });
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
                const val = devices[k];
                if (Array.isArray(val)) {
                    val.forEach(id => {
                        if (id > 0 && occupied[k]) occupied[k].push(id);
                    });
                } else if (typeof val === 'number' && val > 0 && occupied[k]) {
                    occupied[k].push(val);
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
            peopleCount, snacks, devices, price, snackDetails,  thunderCoinsUsed = 0 
        } = req.body;

        // Deduct snacks if provided
        if (snackDetails && Array.isArray(snackDetails) && snackDetails.length > 0) {
            await snackService.deductStock(snackDetails);
        } else if (snacks && Array.isArray(snacks)) {
            // Handle case where snacks is sent as array directly (consistency)
            await snackService.deductStock(snacks);
        }

        // 1. Get currently occupied IDs
        const snapshot = await db
            .collection('sessions')
            .where('status', '==', 'active')
            .get();

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        snapshot.forEach(doc => {
            const d = doc.data().devices || {};
            Object.keys(d).forEach(k => {
                const val = d[k];
                if (Array.isArray(val)) {
                    val.forEach(id => {
                        if (id > 0 && occupied[k]) occupied[k].push(id);
                    });
                } else if (typeof val === 'number' && val > 0 && occupied[k]) {
                    occupied[k].push(val);
                }
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
        // devicesVal is expected to be { ps: [1, 2] }
        for (const key in devicesVal) {
            const val = devicesVal[key];
            const requestedIds = Array.isArray(val) ? val : (typeof val === 'number' && val > 0 ? [val] : []);

            for (const requestedId of requestedIds) {
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
        }

        // 3. Create session
        const newSession = {
            customerName,
            contactNumber,
            duration: durationVal,
            peopleCount: peopleVal,
            snacks: snacks || '',
            devices: devicesVal, // Store as is (arrays)
            price: finalPrice,
            status: 'active',
            startTime: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };


        const docRef = await db.collection('sessions').add(newSession);
        // ================= THUNDER COIN DEDUCTION =================
if (thunderCoinsUsed > 0 && contactNumber) {
    try {
        const playerRef = db.collection('battelwinner').doc(contactNumber);
        const playerSnap = await playerRef.get();

        if (playerSnap.exists) {
            const currentCoins = playerSnap.data().thunderCoins || 0;

            // prevent cheating (frontend manipulation safety)
            const safeDeduction = Math.min(currentCoins, thunderCoinsUsed);

            await playerRef.update({
                thunderCoins: currentCoins - safeDeduction,
                updatedAt: new Date().toISOString()
            });

            console.log(`⚡ Deducted ${safeDeduction} coins from ${contactNumber}`);
        }
    } catch (coinErr) {
        console.error("Thunder coin deduction failed:", coinErr);
    }
}


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
                peopleCount: data.peopleCount,
                price: data.price,
                paidAmount: data.paidAmount || 0,
                remainingAmount: data.remainingAmount ?? data.price,
                devices: transformDevicesToArray(data.devices), // Now returns objects
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
    try {
        const { customerName, contactNumber, peopleCount, bookingTime, bookingEndTime, devices } = req.body;
        // bookingTime, bookingEndTime expected ISO string

        if (!db) return res.status(500).json({ message: 'Database not initialized' });

        const start = new Date(bookingTime);
        const end = new Date(bookingEndTime);

        // 1. Validate Availability for the requested time slot
        // We need to check if requested devices are already taken in this slot

        // Validation: Total devices cannot exceed total people
        let totalRequested = 0;
        Object.keys(devices || {}).forEach(k => {
            const val = devices[k];
            if (Array.isArray(val)) totalRequested += val.length;
            // handle number case if strictly needed, but payload is usually arrays now
        });

        // peopleCount might be string or number
        const pCount = parseInt(peopleCount) || 1;
        if (totalRequested > pCount) {
            return res.status(400).json({ message: `Cannot book ${totalRequested} devices for ${pCount} people.` });
        }

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        // Check Active Sessions
        const activeSessions = await db.collection('sessions').where('status', '==', 'active').get();
        activeSessions.forEach(doc => {
            const s = doc.data();
            const sStart = new Date(s.startTime);
            const sEnd = new Date(sStart.getTime() + (s.duration || 1) * 60 * 60 * 1000);

            // Overlap check
            if (sStart < end && sEnd > start) {
                const d = s.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k]; // { ps: [1, 2] } or { ps: 1 }
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // Check Upcoming Bookings
        const bookings = await db.collection('bookings').where('status', '==', 'upcoming').get();
        bookings.forEach(doc => {
            const b = doc.data();
            const bStart = b.bookingTime.toDate ? b.bookingTime.toDate() : new Date(b.bookingTime);
            const bEnd = b.bookingEndTime?.toDate ? b.bookingEndTime.toDate() : new Date(b.bookingEndTime || bStart.getTime() + 60 * 60 * 1000);

            if (bStart < end && bEnd > start) {
                const d = b.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // Verify loaded devices are free and valid
        for (const type of Object.keys(devices || {})) {
            const requestedIds = devices[type]; // [1, 2]
            if (Array.isArray(requestedIds)) {
                for (const id of requestedIds) {
                    // Check if ID is within physical limits
                    if (deviceLimits[type] && id > deviceLimits[type]) {
                        return res.status(400).json({ message: `${type.toUpperCase()} #${id} does not exist (Max ${deviceLimits[type]})` });
                    }

                    if (occupied[type] && occupied[type].includes(id)) {
                        return res.status(400).json({ message: `${type.toUpperCase()} #${id} is not available at this time.` });
                    }
                }
            }
        }

        const newBooking = {
            customerName,
            contactNumber: contactNumber || '',
            bookingTime,
            bookingEndTime: bookingEndTime || null,
            peopleCount: peopleCount || 1,
            devices: devices || {}, // { ps: [1, 2] ... }
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
            const bookingDate = data.bookingTime?.toDate ? data.bookingTime.toDate() : new Date(data.bookingTime);
            const endDate = data.bookingEndTime ? (data.bookingEndTime.toDate ? data.bookingEndTime.toDate() : new Date(data.bookingEndTime)) : null;

            let duration = 0;
            if (endDate) {
                duration = (endDate - bookingDate) / (1000 * 60 * 60);
            }

            return {
                id: doc.id,
                name: data.customerName,
                time: bookingDate.toISOString(),
                endTime: endDate ? endDate.toISOString() : null,
                duration: duration > 0 ? parseFloat(duration.toFixed(1)) : 0,
                devices: transformDevicesToArray(data.devices || {}), // Returns [{ type, id }]
                peopleCount: data.peopleCount
            };
        });

        return res.status(200).json(bookings);

    } catch (error) {
        console.error('❌ getUpcomingBookings error:', error);
        return res.status(500).json({ message: 'Error fetching bookings' });
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

        const occupied = { ps: [], pc: [], vr: [], wheel: [], metabat: [] };

        // 1. Check Active Sessions overlap
        const activeSessions = await db.collection('sessions').where('status', '==', 'active').get();
        activeSessions.forEach(doc => {
            const session = doc.data();
            const start = new Date(session.startTime);
            const duration = session.duration || 1;
            const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

            if (start < requestEnd && end > requestStart) {
                const d = session.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id && !occupied[k].includes(id)) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0 && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // 2. Check Upcoming Bookings overlap
        const upcomingBookings = await db.collection('bookings').where('status', '==', 'upcoming').get();
        upcomingBookings.forEach(doc => {
            const b = doc.data();
            const start = b.bookingTime.toDate ? b.bookingTime.toDate() : new Date(b.bookingTime);
            const end = b.bookingEndTime?.toDate ? b.bookingEndTime.toDate() : new Date(b.bookingEndTime || start.getTime() + 60 * 60 * 1000);

            if (start < requestEnd && end > requestStart) {
                const d = b.devices || {};
                Object.keys(d).forEach(k => {
                    const val = d[k];
                    if (Array.isArray(val)) {
                        val.forEach(id => { if (id && !occupied[k].includes(id)) occupied[k].push(id); });
                    } else if (typeof val === 'number' && val > 0 && !occupied[k].includes(val)) {
                        occupied[k].push(val);
                    }
                });
            }
        });

        // Sort occupied arrays
        Object.keys(occupied).forEach(k => occupied[k].sort((a, b) => a - b));

        return res.status(200).json({ limits: deviceLimits, occupied });

    } catch (error) {
        console.error('❌ getDeviceAvailabilityForTime error:', error);
        return res.status(500).json({ message: 'Error fetching time-based availability' });
    }
};

const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { extraTime, extraPrice, newMember, paidNow, payingPeopleNow, snacks } = req.body;

        // Deduct snacks for update
        if (snacks && Array.isArray(snacks) && snacks.length > 0) {
            await snackService.deductStock(snacks);
        }


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
                const existingVal = updatedDevices[k];
                const newVal = newMember.devices[k];

                // Convert existing to array if number (legacy)
                const existingArr = Array.isArray(existingVal) ? existingVal : (typeof existingVal === 'number' && existingVal > 0 ? [existingVal] : []);
                // Convert new to array if number (legacy)
                const newArr = Array.isArray(newVal) ? newVal : (typeof newVal === 'number' && newVal > 0 ? [newVal] : []);

                // Merge and unique
                const merged = [...new Set([...existingArr, ...newArr])].sort((a, b) => a - b);

                updatedDevices[k] = merged;
            });

            addedPeople = newMember.peopleCount || 0;
        }

        // ---- Final update ----
        await ref.update({
            duration: data.duration + (extraTime || 0),
            peopleCount: data.peopleCount + addedPeople,
            price: totalPrice,
            paidAmount: paid,
            paidPeople: newPaidPeople,
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

                // Use the people count from the booking (or default to 1)
                const finalPeopleCount = booking.peopleCount || 1;

                // Calculate price using shared logic
                const calculatedPrice = calculateSessionPrice(
                    parseFloat(duration.toFixed(2)),
                    finalPeopleCount,
                    booking.devices || {},
                    now // Use current time for pricing rules
                );

                // Create new session
                const newSession = {
                    customerName: booking.customerName,
                    contactNumber: booking.contactNumber || '',
                    duration: parseFloat(duration.toFixed(2)),
                    peopleCount: finalPeopleCount,
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

                // Emit specific event for this conversion
                global.io.emit('booking:converted', {
                    bookingId: doc.id,
                    sessionId: sessionRef.id
                });

                global.io.emit('session:started', {
                    id: sessionRef.id,
                    ...newSession,
                    devices: transformDevicesToArray(newSession.devices)
                });
            }
        }

        console.log(`✅ Converted ${convertedCount} booking(s) to active sessions`);

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
