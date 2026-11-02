import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <h2>HealthCare+</h2>

      <div className="navbar-right">
        {isAdmin ? (
          <Link to="/admin">Doctor Approvals</Link>
        ) : (
          <>
            <Link to="/home">Home</Link>
            <Link to="/appointments">My Appointments</Link>
            {isDoctor && <Link to="/availability">My Availability</Link>}
          </>
        )}

        <div className="profile-menu" ref={menuRef}>
          <button
            className="profile-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            👤
          </button>

          {showMenu && (
            <div className="profile-dropdown">
              {!isAdmin && (
                <Link to="/profile" onClick={() => setShowMenu(false)}>
                  My Profile
                </Link>
              )}
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;