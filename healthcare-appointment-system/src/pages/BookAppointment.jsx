import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const appointment = {
      doctorId: id,
      patientName: name,
      appointmentDate: date,
    };

    localStorage.setItem("appointment", JSON.stringify(appointment));

    navigate("/success");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Book Appointment</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Patient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">Confirm Appointment</button>
      </form>
    </div>
  );
}

export default BookAppointment;