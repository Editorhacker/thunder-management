const { db } = require('../config/firebase');

const getDefaultPricingConfig = () => {
    return {
        // Time ranges
        happyHour: {
            weekdayStartHour: 9, weekdayEndHour: 13, weekdayEndMinute: 45,
            weekendStartHour: 9, weekendEndHour: 11, weekendEndMinute: 45
        },
        normalHour: {
            weekendStartHour: 11, weekendStartMinute: 45, weekendEndHour: 20, weekendEndMinute: 45,
            weekdayStartHour: 13, weekdayStartMinute: 45, weekdayEndHour: 20, weekdayEndMinute: 45
        },
        funNight: { startHour: 20, startMinute: 45, endHour: 6, endMinute: 0 },

        // Device Prices
        vr: { hour: 180, first15m: 50, first30m: 100, remaining: 180 },
        // Happy Hour base prices
        happyHourPrices: {
            ps5: { less30m: 40, onePersonBase: 90, multiplePersonBaseMod: 45, extra30mMod: 30 },
            pc: { less30m: 40, base: 50, extra30m: 30 },
            wheel: { less30m: 80, base: 120, extra60m: 60 }
        },
        // Normal Hour prices
        normalHourPrices: {
            wheel: { less30m: 90, base: 150, extra30m: 75 },
            pc: { hourRateIfMoreThan3h: 50, base: 60, extra30m: 40 },
            ps5: { onePerson: 140, twoPerson: 120, multiplePersonBaseMod: 50, extra30mMod: 40 }
        },
        // Fun Night prices
        funNightPrices: {
            wheel: { less30m: 90, base: 150, extra30m: 75 },
            pc: { hourRateIfMoreThan3h: 50, base: 50, extra30m: 30 },
            ps5: { onePerson: 100, multiplePersonBaseMod: 50, extra30mMod: 30 }
        },
        // Fallback
        fallback: { hourRate: 50 }
    };
};

const getPricing = async (req, res) => {
    try {
        const docRef = db.collection('settings').doc('pricing');
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(200).json(getDefaultPricingConfig());
        }
        res.status(200).json(doc.data());
    } catch (error) {
        console.error('Error fetching pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updatePricing = async (req, res) => {
    try {
        const newConfig = req.body;
        const docRef = db.collection('settings').doc('pricing');
        await docRef.set(newConfig);
        res.status(200).json({ message: 'Pricing updated successfully', data: newConfig });
    } catch (error) {
        console.error('Error updating pricing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getPricing, updatePricing };
