import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/axios";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Preview kosam: roju ki enni slots vastayo
const countSlots = (start, end, step, breakStart, breakEnd) => {
  if (!start || !end || !step) return 0;

  const s = toMinutes(start);
  const e = toMinutes(end);
  const hasBreak = breakStart && breakEnd;
  const bs = hasBreak ? toMinutes(breakStart) : 0;
  const be = hasBreak ? toMinutes(breakEnd) : 0;

  let count = 0;
  for (let t = s; t + step <= e; t += step) {
    if (hasBreak && t < be && t + step > bs) continue;
    count++;
  }
  return count;
};

function Availability() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [days, setDays] = useState([]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");

  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== "doctor") return;

    const fetchAvailability = async () => {
      try {
        const res = await API.get("/doctors/me/availability");
        const a = res.data.availability;

        setDays(a.days);
        setStartTime(a.startTime);
        setEndTime(a.endTime);
        setSlotMinutes(a.slotMinutes);
        setBreakStart(a.breakStart || "");
        setBreakEnd(a.breakEnd || "");
        setIsDefault(res.data.isDefault);
      } catch (err) {
        setError("Could not load your availability.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  if (user?.role !== "doctor") {
    return <Navigate to="/home" replace />;
  }

  const toggleDay = (index) => {
    setSuccess("");
    setDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      await API.put("/doctors/me/availability", {
        days,
        startTime,
        endTime,
        slotMinutes: Number(slotMinutes),
        breakStart,
        breakEnd,
      });

      setIsDefault(false);
      setSuccess("Availability saved. Patients will now see these slots.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1>My Availability</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const perDay = countSlots(startTime, endTime, Number(slotMinutes), breakStart, breakEnd);

  return (
    <div className="container">
      <h1>My Availability</h1>
      <p style={{ color: "#6d28d9", marginBottom: "16px" }}>
        Set the days and hours patients can book with you.
      </p>

      {isDefault && (
        <p className="doctor-note" style={{ marginBottom: "16px" }}>
          You haven't saved your availability yet. The default is shown below
          (Mon–Sat, 10:00 AM – 5:00 PM). Save to confirm or change it.
        </p>
      )}

      <form className="appointment-card availability-form" onSubmit={handleSave}>
        <p className="availability-label">Working days</p>
        <div className="day-row">
          {DAY_LABELS.map((label, index) => (
            <button
              type="button"
              key={label}
              className={`day-toggle ${days.includes(index) ? "active" : ""}`}
              onClick={() => toggleDay(index)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="availability-grid">
          <label>
            Start time
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setSuccess("");
              }}
              required
            />
          </label>

          <label>
            End time
            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setSuccess("");
              }}
              required
            />
          </label>

          <label>
            Slot length
            <select
              value={slotMinutes}
              onChange={(e) => {
                setSlotMinutes(e.target.value);
                setSuccess("");
              }}
            >
              {SLOT_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="availability-label">Break (optional)</p>
        <div className="availability-grid">
          <label>
            Break start
            <input
              type="time"
              value={breakStart}
              onChange={(e) => {
                setBreakStart(e.target.value);
                setSuccess("");
              }}
            />
          </label>

          <label>
            Break end
            <input
              type="time"
              value={breakEnd}
              onChange={(e) => {
                setBreakEnd(e.target.value);
                setSuccess("");
              }}
            />
          </label>

          <button
            type="button"
            className="cancel-btn-secondary clear-break-btn"
            onClick={() => {
              setBreakStart("");
              setBreakEnd("");
              setSuccess("");
            }}
          >
            Clear break
          </button>
        </div>

        <p className="availability-preview">
          📅 About <strong>{perDay}</strong> slots per working day
        </p>

        {error && <p className="form-error">⚠️ {error}</p>}
        {success && <p className="form-success">✅ {success}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </form>
    </div>
  );
}

export default Availability;