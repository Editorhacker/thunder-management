const { db } = require('../config/firebase');

const getDefaultPricingConfig = () => {
    return {
        // Time ranges
        happyHour: {
            monWedStartHour: 9, monWedStartMinute: 0, monWedEndHour: 13, monWedEndMinute: 45,
            thursdayStartHour: 9, thursdayStartMinute: 0, thursdayEndHour: 11, thursdayEndMinute: 45,
            friSunStartHour: 9, friSunStartMinute: 0, friSunEndHour: 11, friSunEndMinute: 45
        },
        normalHour: {
            monWedStartHour: 13, monWedStartMinute: 45, monWedEndHour: 20, monWedEndMinute: 45,
            thursdayStartHour: 11, thursdayStartMinute: 45, thursdayEndHour: 20, thursdayEndMinute: 45,
            friSunStartHour: 11, friSunStartMinute: 45, friSunEndHour: 20, friSunEndMinute: 45
        },
        funNight: { startHour: 20, startMinute: 45, endHour: 6, endMinute: 0 },

        // Device Prices
        vr: { hour: 180, first15m: 50, first30m: 100, remaining: 180 },
        monWedPrices: {
            happyHour: {
                ps5: { less30m: 40, onePerson: 120, multiplePersonBaseMod: 50, extra30mMod: 60 },
                pc: { less30m: 40, base: 50, extra30m: 30 },
                wheel: { less30m: 80, base: 120, extra60m: 60, extra30m: 60 }
            },
            normalHour: {
                ps5: { onePerson: 120, multiplePersonBaseMod: 50, extra30mMod: 60 },
                pc: { base: 60, extra30m: 40, hourRateIfMoreThan3h: 50 },
                wheel: { less30m: 90, base: 150, extra30m: 75 }
            }
        },
        thursdayPrices: {
            happyHour: {
                ps5: { less30m: 40, onePerson: 120, multiplePersonBaseMod: 50, extra30mMod: 60 },
                pc: { less30m: 40, base: 50, extra30m: 30 },
                wheel: { less30m: 80, base: 120, extra60m: 60, extra30m: 60 }
            },
            normalHour: {
                ps5: { onePerson: 120, multiplePersonBaseMod: 50, extra30mMod: 60 },
                pc: { base: 60, extra30m: 40, hourRateIfMoreThan3h: 50 },
                wheel: { less30m: 90, base: 150, extra30m: 75 }
            }
        },
        friSunPrices: {
            happyHour: {
                ps5: { less30m: 40, onePerson: 120, multiplePersonBaseMod: 50, extra30mMod: 60 },
                pc: { less30m: 40, base: 50, extra30m: 30 },
                wheel: { less30m: 80, base: 120, extra60m: 60, extra30m: 60 }
            },
            normalHour: {
                ps5: { onePerson: 120, multiplePersonBaseMod: 50, extra30mMod: 60 },
                pc: { base: 60, extra30m: 40, hourRateIfMoreThan3h: 50 },
                wheel: { less30m: 90, base: 150, extra30m: 75 }
            }
        },
        // Fun Night prices
        funNightPrices: {
            ps5: { onePerson: 100, multiplePersonBaseMod: 50, extra30mMod: 50 },
            pc: { base: 50, extra30m: 30, hourRateIfMoreThan3h: 50 },
            wheel: { less30m: 90, base: 150, extra30m: 75 }
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

module.exports = { getPricing, updatePricing, getDefaultPricingConfig };
