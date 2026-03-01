export interface PricingConfig {
    happyHour: {
        weekdayStartHour: number; weekdayEndHour: number; weekdayEndMinute: number;
        weekendStartHour: number; weekendEndHour: number; weekendEndMinute: number;
    };
    normalHour: {
        weekendStartHour: number; weekendStartMinute: number; weekendEndHour: number; weekendEndMinute: number;
        weekdayStartHour: number; weekdayStartMinute: number; weekdayEndHour: number; weekdayEndMinute: number;
    };
    funNight: { startHour: number; startMinute: number; endHour: number; endMinute: number; };

    vr: { hour: number; first15m: number; first30m: number; remaining: number; };

    happyHourPrices: {
        ps5: { less30m: number; onePersonBase: number; multiplePersonBaseMod: number; extra30mMod: number; };
        pc: { less30m: number; base: number; extra30m: number; };
        wheel: { less30m: number; base: number; extra60m: number; };
    };

    normalHourPrices: {
        wheel: { less30m: number; base: number; extra30m: number; };
        pc: { hourRateIfMoreThan3h: number; base: number; extra30m: number; };
        ps5: { onePerson: number; twoPerson: number; multiplePersonBaseMod: number; extra30mMod: number; };
    };

    funNightPrices: {
        wheel: { less30m: number; base: number; extra30m: number; };
        pc: { hourRateIfMoreThan3h: number; base: number; extra30m: number; };
        ps5: { onePerson: number; multiplePersonBaseMod: number; extra30mMod: number; };
    };

    fallback: { hourRate: number; };
}

export const defaultPricingConfig: PricingConfig = {
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
