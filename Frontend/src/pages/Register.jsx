import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Patient-only fields
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Doctor-only fields
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [experience, setExperience] = useState("");
  const [fee, setFee] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const payload =
        role === "doctor"
          ? {
              name,
              email,
              password,
              role,
              specialization,
              hospital,
              experience,
              fee,
              address,
              licenseNumber,
            }
          : { name, email, password, role, phone, age, gender };

      const res = await API.post("/auth/register", payload);

      alert(
        res.data.requiresApproval
          ? "Registration submitted! Your account will be activated after admin verification."
          : "Sign in successful!"
      );
      navigate("/login");
    } catch (error) {
      const message =
        error.response?.data?.message || "Sign in failed. Try again.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="home-link">⬅ Home</Link>

      <div className="auth-box">
        <h1>Create Account 🏥</h1>
        <p>Sign in for your HealthCare+ account</p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">I am a Patient</option>
            <option value="doctor">I am a Doctor</option>
          </select>

          {role === "patient" ? (
            <>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="[0-9]{10}"
                required
              />

              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                max="120"
                required
              />

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </>
          ) : (
            <>
              <p className="doctor-note">
                Doctor accounts are activated after an admin verifies your
                registration number.
              </p>

              <input
                type="text"
                placeholder="Medical Council Registration No."
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                minLength={5}
                required
              />

              <input
                type="text"
                placeholder="Specialization (e.g. Cardiologist)"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Hospital Name"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                required
              />

              <textarea
                placeholder="Hospital Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Experience (e.g. 10 Years)"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Consultation Fee"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
              />
            </>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;