import { useState, useEffect } from "react";
import API from "../api/axios";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    setUser(stored);
    setFormData(stored || {});
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await API.put("/auth/profile", formData);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      const message =
        error.response?.data?.message || "Update failed. Try again.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="detail-page">
        <div className="detail-card">
          <h2>No profile details found.</h2>
        </div>
      </div>
    );
  }

  const isDoctor = user.role === "doctor";

  return (
    <div className="detail-page">
      <div className="detail-card">
        <div className="detail-icon">👤</div>

        <h1>My Profile</h1>

        {!isEditing ? (
          <>
            <div className="detail-info">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>

              {isDoctor ? (
                <>
                  <p><strong>Specialization:</strong> {user.specialization}</p>
                  <p><strong>Hospital:</strong> {user.hospital}</p>
                  <p><strong>Hospital Address:</strong> {user.address}</p>
                  <p><strong>Experience:</strong> {user.experience}</p>
                  <p><strong>Fee:</strong> ₹{user.fee}</p>
                </>
              ) : (
                <>
                  <p><strong>Phone:</strong> {user.phone}</p>
                  <p><strong>Age:</strong> {user.age}</p>
                  <p><strong>Gender:</strong> {user.gender}</p>
                </>
              )}
            </div>

            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </>
        ) : (
          <form onSubmit={handleSave} className="edit-profile-form">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name || ""}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email || ""}
              onChange={handleChange}
              required
            />

            {isDoctor ? (
              <>
                <input
                  type="text"
                  name="specialization"
                  placeholder="Specialization"
                  value={formData.specialization || ""}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="hospital"
                  placeholder="Hospital Name"
                  value={formData.hospital || ""}
                  onChange={handleChange}
                  required
                />

                <textarea
                  name="address"
                  placeholder="Hospital Address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="experience"
                  placeholder="Experience"
                  value={formData.experience || ""}
                  onChange={handleChange}
                  required
                />

                <input
                  type="number"
                  name="fee"
                  placeholder="Consultation Fee"
                  value={formData.fee || ""}
                  onChange={handleChange}
                  required
                />
              </>
            ) : (
              <>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  required
                />

                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={formData.age || ""}
                  onChange={handleChange}
                  required
                />

                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </>
            )}

            <div className="edit-btn-row">
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="cancel-btn-secondary"
                onClick={() => {
                  setFormData(user);
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;