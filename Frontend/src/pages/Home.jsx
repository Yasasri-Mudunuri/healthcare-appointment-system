import { Link } from "react-router-dom";

function Home() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isDoctor = user?.role === "doctor";

  if (isDoctor) {
    return (
      <div className="home-page">
        <div className="home-hero">
          <div className="home-icon">🩺</div>

          <h1>Welcome, {user.name}</h1>

          <p>
            Manage your appointments and connect with your patients — all in
            one place.
          </p>

          <Link to="/appointments">
            <button className="home-cta">View My Appointments</button>
          </Link>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Track Appointments</h3>
            <p>See all appointments booked with you, upcoming and past.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Mark as Completed</h3>
            <p>Update appointment status once a consultation is done.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Manage Profile</h3>
            <p>Keep your specialization, hospital, and fee up to date.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-icon">🏥</div>

        <h1>Healthcare Appointment System</h1>

        <p>
          Book appointments with experienced, trusted doctors — quickly,
          easily, and from anywhere.
        </p>

        <Link to="/doctors">
          <button className="home-cta">Find a Doctor</button>
        </Link>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">👨‍⚕️</div>
          <h3>Trusted Doctors</h3>
          <p>Experienced specialists across multiple fields.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Easy Booking</h3>
          <p>Book your appointment in just a few clicks.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Manage Appointments</h3>
          <p>View, track, and cancel appointments anytime.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;