import { Link } from "react-router-dom";

function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <div className="welcome-icon">🏥</div>

        <h1>Welcome to HealthCare+</h1>

        <p>
          Your trusted healthcare partner for finding doctors and booking
          appointments with ease.
        </p>

        <div className="welcome-buttons">
          <Link to="/login" className="welcome-btn primary">
            Login
          </Link>

          <Link to="/register" className="welcome-btn secondary">
            Sign In
          </Link>
        </div>

        <div className="welcome-features">
          <span>✓ Trusted Doctors</span>
          <span>✓ Easy Booking</span>
          <span>✓ Quick & Simple</span>
        </div>
      </div>
    </div>
  );
}

export default Welcome;