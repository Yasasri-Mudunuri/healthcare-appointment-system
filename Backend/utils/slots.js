const pad = (n) => String(n).padStart(2, "0");

const MAX_ADVANCE_DAYS = 30;

// Doctor ippativaraku availability set cheyyakapothe idi vaadatam
const DEFAULT_AVAILABILITY = {
  days: [1, 2, 3, 4, 5, 6], // Mon-Sat
  startTime: "10:00",
  endTime: "17:00",
  slotMinutes: 30,
  breakStart: "13:00",
  breakEnd: "14:00",
};

const formatDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Server local time prakaram ivala date mariyu ippati time
const getNowLocal = () => {
  const now = new Date();
  return {
    today: formatDate(now),
    nowTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
  };
};

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (minutes) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

// Doctor swayam ga availability set chesara
const hasCustomAvailability = (doctor) => {
  const a = doctor && doctor.availability;
  return !!(
    a &&
    Array.isArray(a.days) &&
    a.days.length > 0 &&
    a.startTime &&
    a.endTime &&
    a.slotMinutes
  );
};

const getAvailability = (doctor) => {
  if (!hasCustomAvailability(doctor)) {
    return { ...DEFAULT_AVAILABILITY, days: [...DEFAULT_AVAILABILITY.days] };
  }

  const a = doctor.availability;
  return {
    days: [...a.days].sort((x, y) => x - y),
    startTime: a.startTime,
    endTime: a.endTime,
    slotMinutes: a.slotMinutes,
    breakStart: a.breakStart || "",
    breakEnd: a.breakEnd || "",
  };
};

// Aa doctor ki, aa date ki slots. bookedTimes = aa date ki already Upcoming appointments time lu
// Return: { closed: true, message } leda { closed: false, slots: [{ time, status }] }
// status: "available" | "booked" | "past"
const buildSlots = (doctor, date, bookedTimes = []) => {
  const invalid = { closed: true, message: "Invalid date." };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return invalid;

  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return invalid;
  }

  const { today, nowMinutes } = getNowLocal();

  if (date < today) {
    return {
      closed: true,
      message: "You cannot book an appointment for a past date.",
    };
  }

  const limit = new Date();
  limit.setDate(limit.getDate() + MAX_ADVANCE_DAYS);
  if (date > formatDate(limit)) {
    return {
      closed: true,
      message: `Appointments can be booked up to ${MAX_ADVANCE_DAYS} days in advance.`,
    };
  }

  const a = getAvailability(doctor);

  if (!a.days.includes(dt.getDay())) {
    return {
      closed: true,
      message: "The doctor is not available on this day. Please choose another date.",
    };
  }

  const start = toMinutes(a.startTime);
  const end = toMinutes(a.endTime);
  const step = a.slotMinutes;
  const hasBreak = a.breakStart && a.breakEnd;
  const bs = hasBreak ? toMinutes(a.breakStart) : 0;
  const be = hasBreak ? toMinutes(a.breakEnd) : 0;

  // Valid HH:MM times matrame (paata data lo vere strings unte ignore)
  const booked = bookedTimes
    .filter((t) => /^\d{2}:\d{2}$/.test(t))
    .map(toMinutes);

  const slots = [];

  for (let t = start; t + step <= end; t += step) {
    // Break tho overlap ayye slots skip
    if (hasBreak && t < be && t + step > bs) continue;

    let status = "available";

    // Slot range lo e appointment aina unte booked
    if (booked.some((bt) => bt >= t && bt < t + step)) {
      status = "booked";
    } else if (date === today && t <= nowMinutes) {
      status = "past";
    }

    slots.push({ time: toTime(t), status });
  }

  if (slots.length === 0) {
    return { closed: true, message: "No slots are configured for this doctor." };
  }

  return { closed: false, slots };
};

module.exports = {
  MAX_ADVANCE_DAYS,
  DEFAULT_AVAILABILITY,
  formatDate,
  getNowLocal,
  toMinutes,
  toTime,
  hasCustomAvailability,
  getAvailability,
  buildSlots,
};