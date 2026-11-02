import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../api/axios";

const pad = (n) => String(n).padStart(2, "0");

// Local date (YYYY-MM-DD). toISOString vaadaledu, endukante adi UTC, date oka roju maarochu
const formatDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getTodayLocal = () => formatDate(new Date());

const getMaxDateLocal = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return formatDate(d);
};

// "14:30" -> "2:30 PM"
const to12h = (time) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
};

function BookAppointment() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");
  const [slotsRefresh, setSlotsRefresh] = useState(0);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await API.get(`/doctors/${id}`);
        setDoctor(res.data);
      } catch (err) {
        console.error("Error fetching doctor:", err);
      }
    };

    fetchDoctor();
  }, [id]);

  // Date maarinappudu aa roju slots techukovadam
  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSlotsMessage("");
      return;
    }

    let cancelled = false;

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        const res = await API.get(`/doctors/${id}/slots`, { params: { date } });

        if (cancelled) return;

        if (res.data.closed) {
          setSlots([]);
          setSlotsMessage(res.data.message);
        } else {
          const visible = res.data.slots.filter((s) => s.status !== "past");
          setSlots(visible);
          setSlotsMessage(
            visible.length === 0
              ? "No more slots are available today. Please choose another date."
              : ""
          );
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setSlotsMessage("Could not load time slots. Please try again.");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    fetchSlots();

    return () => {
      cancelled = true;
    };
  }, [date, id, slotsRefresh]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!time) {
      setError("Please select a time slot.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/appointments", {
        doctorId: id,
        patientName: name,
        appointmentDate: date,
        appointmentTime: time,
      });

      const appointment = res.data.appointment;

      const failedFiles = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("report", file);

        try {
          await API.post(`/appointments/${appointment._id}/reports`, formData);
        } catch (uploadError) {
          failedFiles.push(file.name);
        }
      }

      setLoading(false);

      if (failedFiles.length > 0) {
        alert(
          `Appointment booked, but these files could not be uploaded: ${failedFiles.join(
            ", "
          )}. You can upload them again from My Appointments.`
        );
      }

      navigate("/success", { state: { appointment } });
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || "Booking failed. Please try again."
      );

      // Slot ee lopala vere vallu book chesi unte, slots malli techukovali
      setTime("");
      setSlotsRefresh((n) => n + 1);
    }
  };

  return (
    <div className="detail-page">
      <div className="detail-card">
        <h1>Book Appointment</h1>

        {doctor && (
          <p className="book-with">
            with {doctor.name} ({doctor.specialization}) — {doctor.hospital}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Patient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onInvalid={(e) => e.target.setCustomValidity("Please enter the patient name.")}
            onInput={(e) => e.target.setCustomValidity("")}
            required
          />

          <input
            type="date"
            value={date}
            min={getTodayLocal()}
            max={getMaxDateLocal()}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
              setError("");
            }}
            onInvalid={(e) =>
              e.target.setCustomValidity(
                e.target.validity.valueMissing
                  ? "Please select a date."
                  : "Please choose a date from today up to 30 days ahead."
              )
            }
            onInput={(e) => e.target.setCustomValidity("")}
            required
          />

          {/* Time slots */}
          <div className="slots-section">
            <p className="slots-title">🕒 Available time slots</p>

            {!date && (
              <p className="slots-hint">Select a date to see available slots.</p>
            )}

            {date && slotsLoading && <p className="slots-hint">Loading slots...</p>}

            {date && !slotsLoading && slotsMessage && (
              <p className="slots-message">{slotsMessage}</p>
            )}

            {date && !slotsLoading && slots.length > 0 && (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time}
                    className={`slot-chip ${time === slot.time ? "selected" : ""}`}
                    disabled={slot.status === "booked"}
                    title={slot.status === "booked" ? "Already booked" : ""}
                    onClick={() => {
                      setTime(slot.time);
                      setError("");
                    }}
                  >
                    {to12h(slot.time)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="attach-section">
            <p className="attach-title">📄 Attach previous medical reports (Optional)</p>
            <p className="attach-hint">PDF, JPG or PNG — max 5 MB each</p>

            {files.length > 0 && (
              <ul className="attach-list">
                {files.map((file, index) => (
                  <li key={index}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="attach-remove"
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="upload-label">
              ＋ Add Report
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileChange}
              />
            </label>
          </div>

          {error && <p className="form-error">⚠️ {error}</p>}

          <div className="book-btn-row">
            <Link to={`/doctor/${id}`} className="back-link-inline">
              ⬅ Back
            </Link>

            <button type="submit" disabled={loading}>
              {loading
                ? files.length > 0
                  ? "Booking & uploading..."
                  : "Booking..."
                : "Confirm Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookAppointment;