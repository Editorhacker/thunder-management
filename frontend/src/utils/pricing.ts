import type { PricingConfig } from '../types/pricingConfig';
import { defaultPricingConfig } from '../types/pricingConfig';

export const isHappyHourTime = (date: Date = new Date(), config: PricingConfig = defaultPricingConfig): boolean => {
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const check = config.happyHour;

    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) {
        if (hours < check.weekdayStartHour) return false;
        if (hours < check.weekdayEndHour) return true;
        if (hours === check.weekdayEndHour) return minutes < check.weekdayEndMinute;
        return false;
    }

    if (hours < check.weekendStartHour) return false;
    if (hours < check.weekendEndHour) return true;
    if (hours === check.weekendEndHour) return minutes < check.weekendEndMinute;

    return false;
};


export const isFunNightTime = (date: Date = new Date(), config: PricingConfig = defaultPricingConfig): boolean => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const check = config.funNight;

    // e.g. 20:45 to 6:00
    if (check.startHour > check.endHour) {
        return hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute) || hours < check.endHour || (hours === check.endHour && minutes < check.endMinute);
    } else {
        return (hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute)) && (hours < check.endHour || (hours === check.endHour && minutes < check.endMinute));
    }
};


export const isNormalHourTime = (date: Date = new Date(), config: PricingConfig = defaultPricingConfig): boolean => {
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const isWeekend = day === 0 || day === 6;
    const check = config.normalHour;

    // First check if it's Fun Night, because Fun Night overrides Normal Hour at night
    if (isFunNightTime(date, config)) return false;

    if (isWeekend) {
        if (hours > check.weekendStartHour && hours < check.weekendEndHour) return true;
        if (hours === check.weekendStartHour && hours === check.weekendEndHour) return minutes >= check.weekendStartMinute && minutes < check.weekendEndMinute;
        if (hours === check.weekendStartHour) return minutes >= check.weekendStartMinute;
        if (hours === check.weekendEndHour) return minutes < check.weekendEndMinute;
        return false;
    } else {
        if (hours > check.weekdayStartHour && hours < check.weekdayEndHour) return true;
        if (hours === check.weekdayStartHour && hours === check.weekdayEndHour) return minutes >= check.weekdayStartMinute && minutes < check.weekdayEndMinute;
        if (hours === check.weekdayStartHour) return minutes >= check.weekdayStartMinute;
        if (hours === check.weekdayEndHour) return minutes < check.weekdayEndMinute;
        return false;
    }
};

export const calculateSessionPrice = (
    durationHours: number,
    peopleCount: number,
    devices: { [key: string]: number | number[] },
    startTime: Date = new Date(),
    config: PricingConfig = defaultPricingConfig
): number => {
    const durationMinutes = durationHours * 60;

    const getDeviceIds = (val: number | number[] | undefined): number[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'number' && val > 0) return [val];
        return [];
    };

    const psIds = getDeviceIds(devices.ps);
    const pcIds = getDeviceIds(devices.pc);
    const vrIds = getDeviceIds(devices.vr);
    const wheelIds = getDeviceIds(devices.wheel);
    const metabatIds = getDeviceIds(devices.metabat);

    const numPS = psIds.length;
    const numPC = pcIds.length;
    const numVR = vrIds.length;
    const numWheel = wheelIds.length;
    const numMetaBat = metabatIds.length;

    let grandTotal = 0;

    let assignedPeople = 0;
    const peopleOnPC = numPC;
    const peopleOnVR = numVR;
    const peopleOnWheel = numWheel;
    const peopleOnMetaBat = numMetaBat;

    assignedPeople += peopleOnPC + peopleOnVR + peopleOnWheel + peopleOnMetaBat;

    const peopleOnPS = Math.max(0, peopleCount - assignedPeople);

    const psDistribution: number[] = [];
    if (numPS > 0) {
        if (peopleOnPS === 0) {
            for (let i = 0; i < numPS; i++) psDistribution.push(0);
        } else {
            const base = Math.floor(peopleOnPS / numPS);
            const remainder = peopleOnPS % numPS;
            for (let i = 0; i < numPS; i++) {
                psDistribution.push(i < remainder ? base + 1 : base);
            }
        }
    }

    const { vr: vrConf, happyHourPrices: hhConf, normalHourPrices: nhConf, funNightPrices: fnConf } = config;

    const getVRPrice = (pCount: number) => {
        if (pCount === 0) return 0;
        let rate = 0;

        const fullHours = Math.floor(durationMinutes / 60);
        rate += fullHours * vrConf.hour;

        const remainingMinutes = durationMinutes % 60;
        if (remainingMinutes > 0 && remainingMinutes <= 15) {
            rate += vrConf.first15m;
        } else if (remainingMinutes > 15 && remainingMinutes <= 30) {
            rate += vrConf.first30m;
        } else if (remainingMinutes > 30 && remainingMinutes < 60) {
            rate += vrConf.remaining;
        }

        return rate * pCount;
    };

    grandTotal += numVR * getVRPrice(1);
    grandTotal += numMetaBat * getVRPrice(1);

    const isHappy = isHappyHourTime(startTime, config);
    const isNormal = isNormalHourTime(startTime, config);
    const isFun = isFunNightTime(startTime, config);

    // 1️⃣ HAPPY HOUR
    if (isHappy) {
        // PS5
        psDistribution.forEach((p: number) => {
            if (p === 0) return;
            if (durationMinutes <= 30) {
                grandTotal += hhConf.ps5.less30m * p;
            } else {
                const base = p === 1 ? hhConf.ps5.onePersonBase : hhConf.ps5.multiplePersonBaseMod * p;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                grandTotal += base + (extra30Blocks * hhConf.ps5.extra30mMod * p);
            }
        });

        // PC
        if (numPC > 0) {
            let pcCost = 0;
            if (durationMinutes <= 30) {
                pcCost = hhConf.pc.less30m;
            } else {
                const base = hhConf.pc.base;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                pcCost = base + (extra30Blocks * hhConf.pc.extra30m);
            }
            grandTotal += pcCost * numPC;
        }

        // Wheel
        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) {
                wheelCost = hhConf.wheel.less30m;
            } else {
                const base = hhConf.wheel.base;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                // Note: historical code did extra30Blocks * 60, but config allows us to specify this. 
                // Using extra60m as the 60 extra rate. For now let's apply the original logic using param.
                wheelCost = base + (extra30Blocks * hhConf.wheel.extra60m);
            }
            grandTotal += wheelCost * numWheel;
        }

        return grandTotal;
    }

    // 2️⃣ NORMAL HOUR
    if (isNormal) {
        // Wheel
        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) wheelCost = nhConf.wheel.less30m;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = nhConf.wheel.base + (extra30Blocks * nhConf.wheel.extra30m);
            }
            grandTotal += wheelCost * numWheel;
        }

        // PC
        if (numPC > 0) {
            let pcCost = 0;
            if (durationHours > 3) pcCost = nhConf.pc.hourRateIfMoreThan3h * durationHours;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                pcCost = nhConf.pc.base + (extra30Blocks * nhConf.pc.extra30m);
            }
            grandTotal += pcCost * numPC;
        }

        // PS5
        psDistribution.forEach((p: number) => {
            if (p === 0) return;
            let baseCost;
            if (p === 1) baseCost = nhConf.ps5.onePerson;
            else if (p === 2) baseCost = nhConf.ps5.twoPerson;
            else baseCost = nhConf.ps5.multiplePersonBaseMod * p;

            const extraMinutes = Math.max(0, durationMinutes - 60);
            const extra30Blocks = Math.ceil(extraMinutes / 30);
            grandTotal += baseCost + (extra30Blocks * nhConf.ps5.extra30mMod * p);
        });

        return grandTotal;
    }

    // 3️⃣ FUN NIGHT
    if (isFun) {
        // Wheel
        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) wheelCost = fnConf.wheel.less30m;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = fnConf.wheel.base + (extra30Blocks * fnConf.wheel.extra30m);
            }
            grandTotal += wheelCost * numWheel;
        }

        // PC
        if (numPC > 0) {
            let pcCost = 0;
            if (durationHours > 3) pcCost = fnConf.pc.hourRateIfMoreThan3h * durationHours;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                pcCost = fnConf.pc.base + (extra30Blocks * fnConf.pc.extra30m);
            }
            grandTotal += pcCost * numPC;
        }

        // PS5
        psDistribution.forEach((p: number) => {
            if (p === 0) return;
            const baseCost = p === 1 ? fnConf.ps5.onePerson : fnConf.ps5.multiplePersonBaseMod * p;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            const extra30Blocks = Math.ceil(extraMinutes / 30);
            grandTotal += baseCost + (extra30Blocks * fnConf.ps5.extra30mMod * p);
        });

        return grandTotal;
    }

    // 4️⃣ FALLBACK
    if (grandTotal === 0 && (numPS + numPC + numWheel + numVR + numMetaBat) > 0) {
        return durationHours * peopleCount * config.fallback.hourRate;
    }

    return grandTotal;
};
