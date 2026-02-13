const { db } = require('../config/firebase');
const deviceLimits = require('../config/deviceLimit');

const getLast24HoursStats = async (req, res) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', last24Hours.toISOString())
            .get();

        let totalEntries = 0;
        const deviceCount = {};
        const snackCount = {};
        const hourCount = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            totalEntries++;

            // -------- Devices --------
            if (data.devices) {
                Object.keys(data.devices).forEach(device => {
                    deviceCount[device] =
                        (deviceCount[device] || 0) + data.devices[device];
                });
            }

            // -------- Snacks --------
            if (data.snacks) {
                snackCount[data.snacks] =
                    (snackCount[data.snacks] || 0) + 1;
            }

            // -------- Peak Hour --------
            const hour = new Date(data.startTime).getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });

        const mostPopularDevice =
            Object.entries(deviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const topSnack =
            Object.entries(snackCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const peakHourRaw =
    Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0];

let peakHour = 'N/A';

if (peakHourRaw !== undefined) {
    const hour = Number(peakHourRaw);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    peakHour = `${formattedHour}:00 ${suffix}`;
}


        res.status(200).json({
            totalEntries,
            mostPopularDevice,
            topSnack,
            peakHour
        });

    } catch (error) {
        console.error('❌ Analytics Error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};



const getDeviceOccupancyLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const snapshot = await db.collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        let occupiedDevices = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.devices) return;

            // Sum actual stored device counts
            Object.values(data.devices).forEach(count => {
                occupiedDevices += count;
            });
        });

        // ---- Total device limit ----
        const totalCapacity = Object.values(deviceLimits)
            .reduce((sum, val) => sum + val, 0);

        const remainingDevices = Math.max(
            totalCapacity - occupiedDevices,
            0
        );

        res.status(200).json({
            occupied: occupiedDevices,
            remaining: remainingDevices,
            totalCapacity
        });

    } catch (error) {
        console.error('❌ Device Occupancy Error:', error);
        res.status(500).json({ message: 'Failed to fetch device occupancy' });
    }
};

const getPeakHoursLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        /**
         * Hour buckets: 10 AM (10) → 10 PM (22)
         * Zero-filled by default
         */
        const hourMap = {};
        for (let h = 10; h <= 22; h++) {
            hourMap[h] = 0;
        }

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;

            // 🔥 Convert to IST explicitly
            const date = new Date(data.startTime);
            const istHour = date.getUTCHours() + 5.5;

            // Normalize hour (0–23)
            const hour = Math.floor((istHour + 24) % 24);

            if (hour >= 10 && hour <= 22) {
                hourMap[hour] += Number(data.peopleCount);
            }
        });

        // Convert to ARRAY in correct order
        const result = [];
        for (let h = 10; h <= 22; h++) {
            const suffix = h >= 12 ? 'PM' : 'AM';
            const formattedHour = h % 12 === 0 ? 12 : h % 12;

            result.push({
                time: `${formattedHour} ${suffix}`,
                users: hourMap[h]
            });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Peak Hours Error:', error);
        return res.status(500).json([]);
    }
};

const getDeviceUsageLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Initialize device counters
        const deviceMap = {
            pc: 0,
            ps: 0,
            vr: 0,
            wheel: 0,
            metabat: 0
        };

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.devices) return;

            Object.entries(data.devices).forEach(([device, count]) => {
                if (deviceMap[device] !== undefined) {
                    deviceMap[device] += Number(count);
                }
            });
        });

        // Convert to chart-friendly array (ordered)
        const result = [
            { name: 'PC', usage: deviceMap.pc },
            { name: 'PS5', usage: deviceMap.ps },
            { name: 'VR', usage: deviceMap.vr },
            { name: 'Sim', usage: deviceMap.wheel },
            { name: 'MetaBat', usage: deviceMap.metabat }
        ];

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Device Usage Error:', error);
        return res.status(500).json([]);
    }
};

const getSnacksConsumptionLast24Hours = async (req, res) => {
    try {
        const now = new Date();
        const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const snapshot = await db
            .collection('sessions')
            .where('createdAt', '>=', last24.toISOString())
            .get();

        const snackMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.snacks) return;

            // snacks assumed as string (e.g. "Coke")
            const snack = String(data.snacks).trim();
            if (!snack) return;

            snackMap[snack] = (snackMap[snack] || 0) + 1;
        });

        // Convert to Recharts-friendly array
        const result = Object.entries(snackMap).map(([name, value]) => ({
            name,
            value
        }));

        return res.status(200).json(result); // 👈 ARRAY ONLY

    } catch (error) {
        console.error('❌ Snacks Consumption Error:', error);
        return res.status(500).json([]);
    }
};


const getMonthlyGrowthComparison = async (req, res) => {
    try {
        const now = new Date();

        // ---- Month boundaries ----
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // ---- Week buckets ----
        const weeks = {
            1: { thisMonth: 0, lastMonth: 0 },
            2: { thisMonth: 0, lastMonth: 0 },
            3: { thisMonth: 0, lastMonth: 0 },
            4: { thisMonth: 0, lastMonth: 0 }
        };

        const snapshot = await db.collection('sessions').get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.startTime || !data.peopleCount) return;

            const date = new Date(data.startTime);
            const dayOfMonth = date.getDate();
            const week = Math.min(Math.ceil(dayOfMonth / 7), 4);

            // ---- This Month ----
            if (date >= startOfThisMonth && date <= now) {
                weeks[week].thisMonth += Number(data.peopleCount);
            }

            // ---- Last Month ----
            if (date >= startOfLastMonth && date <= endOfLastMonth) {
                weeks[week].lastMonth += Number(data.peopleCount);
            }
        });

        const result = [
            { day: 'Week 1', lastMonth: weeks[1].lastMonth, thisMonth: weeks[1].thisMonth },
            { day: 'Week 2', lastMonth: weeks[2].lastMonth, thisMonth: weeks[2].thisMonth },
            { day: 'Week 3', lastMonth: weeks[3].lastMonth, thisMonth: weeks[3].thisMonth },
            { day: 'Week 4', lastMonth: weeks[4].lastMonth, thisMonth: weeks[4].thisMonth }
        ];

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Growth comparison error:', error);
        return res.status(500).json([]);
    }
};


module.exports = {
    getDeviceOccupancyLast24Hours,
    getLast24HoursStats,
    getPeakHoursLast24Hours,
    getDeviceUsageLast24Hours,
    getSnacksConsumptionLast24Hours,
    getMonthlyGrowthComparison

};