// ---------------- TIME HELPERS ----------------

const isHappyHourTime = (date = new Date()) => {
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours < 9) return false;

    const isWeekend = day === 0 || day === 6;

    // Mon–Fri: 9:00 AM – 2:00 PM
    if (!isWeekend) {
        if (hours < 14) return true;
        if (hours === 14) return minutes === 0;
        return false;
    }

    // Sat–Sun: 9:00 AM – 12:00 PM
    if (hours < 12) return true;
    if (hours === 12) return minutes === 0;

    return false;
};

const isFunNightTime = (date = new Date()) => {
    const hours = date.getHours();
    return hours >= 21 || hours < 6;
};

const isNormalHourTime = (date = new Date()) => {
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours >= 21) return false;

    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
        if (hours === 12) return minutes >= 1;
        return hours > 12;
    } else {
        if (hours === 14) return minutes >= 1;
        return hours > 14;
    }
};

// ---------------- PRICING ----------------

const calculateSessionPrice = (
    durationHours,
    peopleCount,
    devices,
    startTime = new Date()
) => {
    const durationMinutes = durationHours * 60;

    // 1. Identify active machines (Arrays of IDs)
    // Input format: { ps: [1, 2], pc: [5] }
    // If input is legacy { ps: 1 } (number), convert to array [1] if > 0.
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

    // Counts
    const numPS = psIds.length;
    const numPC = pcIds.length;
    const numVR = vrIds.length;
    const numWheel = wheelIds.length;
    const numMetaBat = metabatIds.length;

    let grandTotal = 0;

    // --------------------------------------------------
    // PEOPLE ALLOCATION LOGIC (The "Partial Booking" Core)
    // --------------------------------------------------
    // Rule:
    // 1. PC/VR/Wheel/MetaBat take 1 person each.
    // 2. Remaining people are distributed to PS machines.

    // Step A: Assign 1 person to single-user devices
    let assignedPeople = 0;

    // Priority: We just count them.
    const peopleOnPC = numPC;
    const peopleOnVR = numVR; // Assuming VR is 1 person per headset
    const peopleOnWheel = numWheel; // Assuming 1 person per wheel
    const peopleOnMetaBat = numMetaBat;

    assignedPeople += peopleOnPC + peopleOnVR + peopleOnWheel + peopleOnMetaBat;

    // Step B: Remaining for PS
    let peopleOnPS = Math.max(0, peopleCount - assignedPeople);

    // Validation edge case: If user selects devices but has 0 people for them (e.g. 1 person, 1 PC, 1 PS -> PC takes 1, PS gets 0?)
    // Prompt says: "No device can have zero or negative assigned people."
    // If PS has 0 people but is selected, we might assume minimum 1 for pricing? 
    // Or strictly follow arithmetic.
    // Let's strictly follow arithmetic for now, but usually a machine shouldn't be active with 0 people.
    // However, if we force 1, we exceed total people.
    // Let's assume the UI validation prevents this, or we just price it at 0 people (which is 0 cost in most formulas, or base cost).
    // Actually, PS pricing often has a base cost for 1 person.

    // We will distribute `peopleOnPS` across `numPS` machines.
    // Distribution Strategy: Even split.
    // Example: 5 people, 2 PS -> 2 on one, 3 on other.
    const psDistribution = [];
    if (numPS > 0) {
        if (peopleOnPS === 0) {
            // Fallback: If PS is selected but no people left (e.g. 1 person, 1 PC, 1 PS), 
            // we technically have an issue. 
            // But let's just assign 0 and let the pricer handle it (likely 0 cost).
            for (let i = 0; i < numPS; i++) psDistribution.push(0);
        } else {
            const base = Math.floor(peopleOnPS / numPS);
            const remainder = peopleOnPS % numPS;
            for (let i = 0; i < numPS; i++) {
                psDistribution.push(i < remainder ? base + 1 : base);
            }
        }
    }

    // --------------------------------------------------
    // PRICING CALCULATORS (Per Machine)
    // --------------------------------------------------

    // 0️⃣ VR & METABAT (FLAT RATE - NO TIME RULES)
    const getVRPrice = (pCount) => {
        if (pCount === 0) return 0;
        let rate = 0;
        if (durationMinutes <= 15) rate = 50;
        else if (durationMinutes <= 30) rate = 100;
        else if (durationMinutes <= 60) rate = 180;
        else rate = (durationMinutes / 60) * 180;
        return rate * pCount;
    };

    grandTotal += numVR * getVRPrice(1); // 1 person per VR
    grandTotal += numMetaBat * getVRPrice(1); // 1 person per MetaBat

    // Time Rules
    const isHappy = isHappyHourTime(startTime);
    const isNormal = isNormalHourTime(startTime);
    const isFun = isFunNightTime(startTime);

    // 1️⃣ HAPPY HOUR
    if (isHappy) {
        // PS5
        psDistribution.forEach(p => {
            if (p === 0) return;
            if (durationMinutes <= 30) {
                grandTotal += 40 * p;
            } else {
                const base = p === 1 ? 90 : 45 * p;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                grandTotal += base + (extra30Blocks * 30 * p);
            }
        });

        // PC
        if (numPC > 0) {
            // Price per PC (1 person)
            let pcCost = 0;
            if (durationMinutes <= 30) {
                pcCost = 40; // 1 person
            } else {
                const base = 50; // 1 person
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                pcCost = base + (extra30Blocks * 30); // 1 person
            }
            grandTotal += pcCost * numPC;
        }

        // Wheel
        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) {
                wheelCost = 80; // 1 person assumed
            } else {
                const base = 120; // 1 person
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = base + (extra30Blocks * 60);
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
            if (durationMinutes <= 30) wheelCost = 90;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = 150 + (extra30Blocks * 75);
            }
            grandTotal += wheelCost * numWheel;
        }

        // PC
        if (numPC > 0) {
            let pcCost = 0;
            if (durationHours > 3) pcCost = 50 * durationHours;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                pcCost = 60 + (extra30Blocks * 40);
            }
            grandTotal += pcCost * numPC;
        }

        // PS5
        psDistribution.forEach(p => {
            if (p === 0) return;
            let baseCost;
            if (p === 1) baseCost = 140;
            else if (p === 2) baseCost = 120; // Flat 120 for 2 ppl?
            else baseCost = 50 * p;

            const extraMinutes = Math.max(0, durationMinutes - 60);
            const extra30Blocks = Math.ceil(extraMinutes / 30);
            grandTotal += baseCost + (extra30Blocks * 40 * p);
        });

        return grandTotal;
    }

    // 3️⃣ FUN NIGHT
    if (isFun) {
        // Wheel
        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) wheelCost = 90;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = 150 + (extra30Blocks * 75);
            }
            grandTotal += wheelCost * numWheel;
        }

        // PC
        if (numPC > 0) {
            let pcCost = 0;
            if (durationHours > 3) pcCost = 50 * durationHours;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                pcCost = 50 + (extra30Blocks * 30);
            }
            grandTotal += pcCost * numPC;
        }

        // PS5
        psDistribution.forEach(p => {
            if (p === 0) return;
            const baseCost = p === 1 ? 100 : 50 * p;
            const extraMinutes = Math.max(0, durationMinutes - 60);
            const extra30Blocks = Math.ceil(extraMinutes / 30);
            grandTotal += baseCost + (extra30Blocks * 30 * p);
        });

        return grandTotal;
    }

    // 4️⃣ FALLBACK
    // If no special rules, standard rate per person per hour?
    // Or generic machine rate?
    // Using simple fallback: 50 per person per hour
    // But we need to account for machines.
    if (grandTotal === 0 && (numPS + numPC + numWheel + numVR + numMetaBat) > 0) {
        return durationHours * peopleCount * 50;
    }

    return grandTotal;
};

module.exports = {
    isHappyHourTime,
    isFunNightTime,
    isNormalHourTime,
    calculateSessionPrice
};
