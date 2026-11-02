import { Link, useLocation } from "react-router-dom";

function Success() {
  const location = useLocation();
  const appointment = location.state?.appointment;

  return (
    <div className="detail-page">
      <div className="detail-card">
        <div className="detail-icon">✅</div>

        <h1>Appointment Booked!</h1>

        {appointment ? (
          <>
            {appointment.tokenNumber && (
              <div className="token-box">
                <p className="token-label">Your Token Number</p>
                <p className="token-number">#{appointment.tokenNumber}</p>
                <p className="token-hint">
                  Show this token at the hospital reception
                </p>
              </div>
            )}

            <div className="detail-info">
              <p><strong>Doctor:</strong> {appointment.doctorName}</p>
              <p><strong>Patient:</strong> {appointment.patientName}</p>
              <p><strong>Date:</strong> {appointment.appointmentDate}</p>
              <p><strong>Time:</strong> {appointment.appointmentTime}</p>
            </div>
          </>
        ) : (
          <p>Your appointment has been booked successfully.</p>
        )}

        <Link to="/appointments">
          <button>View My Appointments</button>
        </Link>
      </div>
    </div>
  );
}

export default Success;