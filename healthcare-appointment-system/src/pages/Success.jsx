import { useEffect, useState } from "react";

function Success() {
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("appointment"));
    setAppointment(data);
  }, []);

  if (!appointment) {
    return <h2>No Appointment Found</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎉 Appointment Booked Successfully!</h1>

      <p><b>Patient:</b> {appointment.patientName}</p>
      <p><b>Date:</b> {appointment.appointmentDate}</p>
      <p><b>Doctor ID:</b> {appointment.doctorId}</p>
    </div>
  );
}

export default Success;