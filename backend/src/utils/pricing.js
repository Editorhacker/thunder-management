// ---------------- TIME HELPERS ----------------

const isHappyHourTime = (date = new Date(), config) => {
    if (!config) return false;
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const check = config.happyHour;
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const isFriSun = day === 5 || day === 6 || day === 0;

    if (isMonWed) {
        if (hours < check.monWedStartHour) return false;
        if (hours < check.monWedEndHour) return true;
        if (hours === check.monWedEndHour) return minutes < check.monWedEndMinute;
        return false;
    }

    if (isThursday) {
        if (hours < check.thursdayStartHour) return false;
        if (hours < check.thursdayEndHour) return true;
        if (hours === check.thursdayEndHour) return minutes < check.thursdayEndMinute;
        return false;
    }

    if (isFriSun) {
        if (hours < check.friSunStartHour) return false;
        if (hours < check.friSunEndHour) return true;
        if (hours === check.friSunEndHour) return minutes < check.friSunEndMinute;
        return false;
    }

    return false;
};

const isFunNightTime = (date = new Date(), config) => {
    if (!config) return false;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const check = config.funNight;

    if (check.startHour > check.endHour) {
        return hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute) || hours < check.endHour || (hours === check.endHour && minutes < check.endMinute);
    } else {
        return (hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute)) && (hours < check.endHour || (hours === check.endHour && minutes < check.endMinute));
    }
};

const isNormalHourTime = (date = new Date(), config) => {
    if (!config) return false;
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const isFriSun = day === 5 || day === 6 || day === 0;

    const check = config.normalHour;

    if (isFunNightTime(date, config)) return false;

    if (isMonWed) {
        if (hours > check.monWedStartHour && hours < check.monWedEndHour) return true;
        if (hours === check.monWedStartHour && hours === check.monWedEndHour) return minutes >= check.monWedStartMinute && minutes < check.monWedEndMinute;
        if (hours === check.monWedStartHour) return minutes >= check.monWedStartMinute;
        if (hours === check.monWedEndHour) return minutes < check.monWedEndMinute;
        return false;
    } else if (isThursday) {
        if (hours > check.thursdayStartHour && hours < check.thursdayEndHour) return true;
        if (hours === check.thursdayStartHour && hours === check.thursdayEndHour) return minutes >= check.thursdayStartMinute && minutes < check.thursdayEndMinute;
        if (hours === check.thursdayStartHour) return minutes >= check.thursdayStartMinute;
        if (hours === check.thursdayEndHour) return minutes < check.thursdayEndMinute;
        return false;
    } else if (isFriSun) {
        if (hours > check.friSunStartHour && hours < check.friSunEndHour) return true;
        if (hours === check.friSunStartHour && hours === check.friSunEndHour) return minutes >= check.friSunStartMinute && minutes < check.friSunEndMinute;
        if (hours === check.friSunStartHour) return minutes >= check.friSunStartMinute;
        if (hours === check.friSunEndHour) return minutes < check.friSunEndMinute;
        return false;
    }
    return false;
};

// ---------------- PRICING ----------------

const calculateSessionPrice = (
    durationHours,
    peopleCount,
    devices,
    startTime = new Date(),
    config // Pass config from controller
) => {
    if (!config) return 0;

    const durationMinutes = durationHours * 60;

    const getDeviceIds = (val) => {
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

    const psDistribution = [];
    if (numPS > 0) {
        if (peopleOnPS === 0) {
            for (let i = 0; i < numPS; i++) psDistribution.push(0);
        } else {
            const baseSplit = Math.floor(peopleOnPS / numPS);
            const remainder = peopleOnPS % numPS;
            for (let i = 0; i < numPS; i++) {
                psDistribution.push(i < remainder ? baseSplit + 1 : baseSplit);
            }
        }
    }

    const { vr: vrConf, funNightPrices: fnConf } = config;

    const getVRPrice = (pCount) => {
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

    const day = startTime.getDay();
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const dayPrices = isMonWed ? config.monWedPrices : (isThursday ? config.thursdayPrices : config.friSunPrices);
    const hhConf = dayPrices.happyHour;
    const nhConf = dayPrices.normalHour;

    const isHappy = isHappyHourTime(startTime, config);
    const isNormal = isNormalHourTime(startTime, config);
    const isFun = isFunNightTime(startTime, config);

    // 1️⃣ HAPPY HOUR
    if (isHappy) {
        psDistribution.forEach(p => {
            if (p === 0) return;
            const base = p === 1 ? hhConf.ps5.onePerson : hhConf.ps5.multiplePersonBaseMod * p;
            if (durationMinutes <= 30) {
                grandTotal += (hhConf.ps5.less30m || (base / 2)) * p;
            } else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                grandTotal += base + (extraMinutes * (base / 60));
            }
        });

        if (numPC > 0) {
            const base = hhConf.pc.base;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            const pcCost = durationMinutes <= 30 ? (hhConf.pc.less30m || (base / 2)) : (base + (extraMinutes * (base / 60)));
            grandTotal += pcCost * numPC;
        }

        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) {
                wheelCost = hhConf.wheel.less30m;
            } else {
                const base = hhConf.wheel.base;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = base + (extra30Blocks * hhConf.wheel.extra60m);
            }
            grandTotal += wheelCost * numWheel;
        }

        return grandTotal;
    }

    // 2️⃣ NORMAL HOUR
    if (isNormal) {
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

        if (numPC > 0) {
            const base = nhConf.pc.base;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            let pcCost = base + (extraMinutes * (base / 60));
            if (durationHours > 5 && nhConf.pc.hourRateIfMoreThan3h) {
                pcCost = Math.min(pcCost, nhConf.pc.hourRateIfMoreThan3h * durationHours);
            }
            grandTotal += pcCost * numPC;
        }

        psDistribution.forEach(p => {
            if (p === 0) return;
            const baseCost = p === 1 ? nhConf.ps5.onePerson : nhConf.ps5.multiplePersonBaseMod * p;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            grandTotal += baseCost + (extraMinutes * (baseCost / 60));
        });

        return grandTotal;
    }

    // 3️⃣ FUN NIGHT
    if (isFun) {
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

        if (numPC > 0) {
            const base = fnConf.pc.base;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            let pcCost = base + (extraMinutes * (base / 60));
            if (durationHours > 3 && fnConf.pc.hourRateIfMoreThan3h) {
                pcCost = Math.min(pcCost, fnConf.pc.hourRateIfMoreThan3h * durationHours);
            }
            grandTotal += pcCost * numPC;
        }

        psDistribution.forEach(p => {
            if (p === 0) return;
            const baseCost = p === 1 ? fnConf.ps5.onePerson : fnConf.ps5.multiplePersonBaseMod * p;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            grandTotal += baseCost + (extraMinutes * (baseCost / 60));
        });

        return grandTotal;
    }

    if (grandTotal === 0 && (numPS + numPC + numWheel + numVR + numMetaBat) > 0) {
        return durationHours * peopleCount * (config.fallback?.hourRate || 50);
    }

    return grandTotal;
};

const calculateRevenueByMachine = (
    durationHours,
    peopleCount,
    devices,
    startTime = new Date(),
    config
) => {
    if (!config) return { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 };
    const revenue = { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 };
    const durationMinutes = durationHours * 60;

    const getIds = (val) => Array.isArray(val) ? val : (typeof val === 'number' && val > 0 ? [val] : []);

    const ps = getIds(devices.ps);
    const pc = getIds(devices.pc);
    const vr = getIds(devices.vr);
    const wheel = getIds(devices.wheel);
    const meta = getIds(devices.metabat);

    const { vr: vrConf } = config;
    const vrRate = durationMinutes <= 15 ? (vrConf.first15m) :
        durationMinutes <= 30 ? (vrConf.first30m) :
            durationMinutes <= 60 ? (vrConf.hour) :
                (durationMinutes / 60) * vrConf.hour;

    revenue.vr += vr.length * vrRate;
    revenue.metabat += meta.length * vrRate;

    const day = startTime.getDay();
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const dayPrices = isMonWed ? config.monWedPrices : (isThursday ? config.thursdayPrices : config.friSunPrices);
    const hhConf = dayPrices.happyHour;
    const nhConf = dayPrices.normalHour;
    const fnConf = config.funNightPrices;

    const isHappy = isHappyHourTime(startTime, config);
    const isNormal = isNormalHourTime(startTime, config);
    const isFun = isFunNightTime(startTime, config);

    if (pc.length > 0) {
        let pcCost = 0;
        const curConf = isHappy ? hhConf.pc : (isNormal ? nhConf.pc : fnConf.pc);
        const base = curConf.base;
        const extraMinutes = Math.max(0, durationMinutes - 60);
        pcCost = base + (extraMinutes * (base / 60));

        if (isHappy && durationMinutes <= 30) {
            pcCost = curConf.less30m || (base / 2);
        } else if (durationHours > 3 && !isHappy && curConf.hourRateIfMoreThan3h) {
            pcCost = Math.min(pcCost, curConf.hourRateIfMoreThan3h * durationHours);
        }
        revenue.pc += pcCost * pc.length;
    }

    if (wheel.length > 0) {
        let wheelCost = 0;
        const curConf = isHappy ? hhConf.wheel : (isNormal ? nhConf.wheel : fnConf.wheel);
        if (durationMinutes <= 30) {
            wheelCost = curConf.less30m;
        } else {
            const extraMinutes = Math.max(0, durationMinutes - 60);
            const extra30Blocks = Math.ceil(extraMinutes / 30);
            const extraRate = isHappy ? (curConf.extra60m / 2) : curConf.extra30m;
            wheelCost = curConf.base + (extra30Blocks * extraRate);
        }
        revenue.wheel += wheelCost * wheel.length;
    }

    if (ps.length > 0) {
        const psPeople = Math.max(ps.length, peopleCount - (pc.length + vr.length + wheel.length + meta.length));
        const avgPeoplePerPS = psPeople / ps.length;
        const curConf = isHappy ? hhConf.ps5 : (isNormal ? nhConf.ps5 : fnConf.ps5);

        const baseRate = avgPeoplePerPS === 1 ? (curConf.onePerson || curConf.onePersonBase) : curConf.multiplePersonBaseMod * avgPeoplePerPS;
        const extraMinutes = Math.max(0, durationMinutes - 60);
        const psCost = baseRate + (extraMinutes * (baseRate / 60));
        revenue.ps += psCost * ps.length;
    }

    return revenue;
};

module.exports = {
    isHappyHourTime,
    isFunNightTime,
    isNormalHourTime,
    calculateSessionPrice,
    calculateRevenueByMachine
};
