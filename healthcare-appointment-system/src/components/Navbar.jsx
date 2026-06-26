import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <h2>HealthCare+</h2>

      <div>
        <Link to="/">Home</Link> |{" "}
        <Link to="/doctors">Doctors</Link>
      </div>
    </nav>
  );
}

export default Navbar;