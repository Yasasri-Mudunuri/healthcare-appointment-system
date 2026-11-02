import { useState, useEffect } from "react";
import API from "../api/axios";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/admin/doctors");
      setDoctors(res.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setBusyId(id);
      await API.put(`/admin/doctors/${id}/approve`);
      await fetchDoctors();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to approve.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectSubmit = async (e, id) => {
    e.preventDefault();

    try {
      setBusyId(id);
      await API.put(`/admin/doctors/${id}/reject`, { reason });
      setRejectingId(null);
      setReason("");
      await fetchDoctors();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject.");
    } finally {
      setBusyId(null);
    }
  };

  const countFor = (key) =>
    doctors.filter((d) => (d.verificationStatus || "approved") === key).length;

  const visible = doctors.filter(
    (d) => (d.verificationStatus || "approved") === activeTab
  );

  if (loading) {
    return (
      <div className="container">
        <h1>Doctor Approvals</h1>
        <p>Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Doctor Approvals</h1>
      <p style={{ color: "#6d28d9", marginBottom: "16px" }}>
        Check each doctor's registration number before approving.
      </p>

      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.key);
              setRejectingId(null);
            }}
          >
            {tab.label} ({countFor(tab.key)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p>No {activeTab} doctors.</p>
      ) : (
        <div className="appointment-list">
          {visible.map((doc) => (
            <div key={doc._id} className="appointment-card">
              <h3>{doc.name}</h3>
              <p>{doc.specialization}</p>
              <p className="hospital-name">🏥 {doc.hospital}</p>
              {doc.address && <p className="hospital-name">📍 {doc.address}</p>}
              <p>
                Experience: {doc.experience} | Fee: ₹{doc.fee}
              </p>
              <p>Email: {doc.email}</p>
              <p>
                <strong>Registration No.:</strong>{" "}
                {doc.licenseNumber || "Not provided"}
              </p>

              {activeTab === "rejected" && doc.rejectionReason && (
                <p className="reject-reason">
                  Reason: {doc.rejectionReason}
                </p>
              )}

              {rejectingId === doc._id ? (
                <form
                  className="reject-form"
                  onSubmit={(e) => handleRejectSubmit(e, doc._id)}
                >
                  <textarea
                    placeholder="Reason (doctor ki chupistham)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <div className="admin-actions">
                    <button
                      type="submit"
                      className="reject-btn"
                      disabled={busyId === doc._id}
                    >
                      {busyId === doc._id ? "Saving..." : "Confirm"}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn-secondary"
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="admin-actions">
                  {activeTab !== "approved" && (
                    <button
                      className="approve-btn"
                      disabled={busyId === doc._id}
                      onClick={() => handleApprove(doc._id)}
                    >
                      Approve
                    </button>
                  )}

                  {activeTab !== "rejected" && (
                    <button
                      className="reject-btn"
                      onClick={() => {
                        setRejectingId(doc._id);
                        setReason("");
                      }}
                    >
                      {activeTab === "approved" ? "Revoke" : "Reject"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;