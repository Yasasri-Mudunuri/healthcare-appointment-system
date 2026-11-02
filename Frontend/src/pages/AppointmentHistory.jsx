import { useState, useEffect } from "react";
import API from "../api/axios";
import StarRating from "../components/StarRating";
import FileLink from "../components/FileLink";

const pad = (n) => String(n).padStart(2, "0");

// Local date (YYYY-MM-DD)
const getTodayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

function AppointmentHistory() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isDoctor = user?.role === "doctor";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadingRxId, setUploadingRxId] = useState(null);

  // Reviews (patient: tana ichina vaati; doctor: tanaku vachina vaati)
  const [reviewsByAppt, setReviewsByAppt] = useState({});
  const [doctorSummary, setDoctorSummary] = useState({
    averageRating: 0,
    reviewCount: 0,
  });
  const [reviewFormId, setReviewFormId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchAppointments();

    if (isDoctor) {
      fetchReceivedReviews();
    } else {
      fetchMyReviews();
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const endpoint = isDoctor ? "/appointments/doctor/my" : "/appointments/my";
      const res = await API.get(endpoint);
      setAppointments(res.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const res = await API.get("/reviews/my");
      const map = {};
      res.data.forEach((r) => {
        map[String(r.appointmentId)] = r;
      });
      setReviewsByAppt(map);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchReceivedReviews = async () => {
    try {
      const res = await API.get("/reviews/received");
      const map = {};
      res.data.reviews.forEach((r) => {
        map[String(r.appointmentId)] = r;
      });
      setReviewsByAppt(map);
      setDoctorSummary({
        averageRating: res.data.averageRating,
        reviewCount: res.data.reviewCount,
      });
    } catch (error) {
      console.error("Error fetching received reviews:", error);
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.put(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (error) {
      alert("Failed to cancel appointment.");
    }
  };

  const handleComplete = async (id) => {
    try {
      await API.put(`/appointments/${id}/complete`);
      fetchAppointments();
    } catch (error) {
      alert("Failed to mark as completed.");
    }
  };

  const handleReportUpload = async (id, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("report", file);

    try {
      setUploadingId(id);
      await API.post(`/appointments/${id}/reports`, formData);
      fetchAppointments();
    } catch (error) {
      const message = error.response?.data?.message || "Upload failed. Try again.";
      alert(message);
    } finally {
      setUploadingId(null);
    }
  };

  const handlePrescriptionUpload = async (id, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("prescription", file);

    try {
      setUploadingRxId(id);
      await API.post(`/appointments/${id}/prescriptions`, formData);
      fetchAppointments();
    } catch (error) {
      const message = error.response?.data?.message || "Upload failed. Try again.";
      alert(message);
    } finally {
      setUploadingRxId(null);
    }
  };

  const openReviewForm = (id) => {
    setReviewFormId(id);
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
  };

  const closeReviewForm = () => {
    setReviewFormId(null);
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
  };

  const handleReviewSubmit = async (e, appointmentId) => {
    e.preventDefault();
    setReviewError("");

    if (!reviewRating) {
      setReviewError("Please select a star rating.");
      return;
    }

    try {
      setSubmittingReview(true);

      const res = await API.post("/reviews", {
        appointmentId,
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewsByAppt((prev) => ({
        ...prev,
        [appointmentId]: res.data.review,
      }));
      closeReviewForm();
    } catch (error) {
      setReviewError(
        error.response?.data?.message || "Could not submit your review."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const getDisplayStatus = (appt) => {
    if (appt.status === "Cancelled" || appt.status === "Completed") {
      return appt.status;
    }

    if (isDoctor) {
      return "Upcoming";
    }

    const [year, month, day] = appt.appointmentDate.split("-").map(Number);
    const apptDate = new Date(year, month - 1, day);
    apptDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptDate < today) {
      return "Completed";
    }

    return "Upcoming";
  };

  // Prescription box lo chupinche chinna message (file lekunda unnappudu)
  const getPrescriptionMessage = (appt, canAddPrescription, today) => {
    if (isDoctor) {
      if (canAddPrescription) return "No prescription added yet.";
      if (appt.status === "Completed")
        return "This appointment is completed. No prescription was added.";
      return "You can add a prescription on or after the appointment date.";
    }

    if (appt.appointmentDate < today || appt.status === "Completed")
      return "No prescription was added.";
    return "Your doctor can add a prescription after the consultation.";
  };

  if (loading) {
    return (
      <div className="container">
        <h1>My Appointments</h1>
        <p>Loading appointments...</p>
      </div>
    );
  }

  const today = getTodayLocal();

  return (
    <div className="container">
      <h1>{isDoctor ? "My Appointments (Patients)" : "My Appointments"}</h1>

      {/* Doctor ki: tanaku vachina rating summary */}
      {isDoctor && (
        <div className="doctor-rating-banner">
          {doctorSummary.reviewCount > 0 ? (
            <>
              <span className="banner-label">Your rating</span>
              <StarRating value={doctorSummary.averageRating} />
              <strong>{Number(doctorSummary.averageRating).toFixed(1)}</strong>
              <span className="muted">
                ({doctorSummary.reviewCount}{" "}
                {doctorSummary.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </>
          ) : (
            <span className="muted">
              No patient reviews yet. Reviews appear here after patients rate
              their completed visits.
            </span>
          )}
        </div>
      )}

      {appointments.length === 0 ? (
        <p>No appointments yet.</p>
      ) : (
        <div className="appointment-list">
          {appointments.map((appt) => {
            const displayStatus = getDisplayStatus(appt);
            const reports = appt.reports || [];
            const prescriptions = appt.prescriptions || [];
            const myReview = reviewsByAppt[String(appt._id)];

            // Doctor prescription add cheyyadaniki: Upcoming, date ivala/gatinchindi, inka prescription ledu
            const canAddPrescription =
              isDoctor &&
              appt.status === "Upcoming" &&
              appt.appointmentDate <= today &&
              prescriptions.length === 0;

            return (
              <div key={appt._id} className="appointment-card">
                <div className="appt-header-row">
                  <h3>{isDoctor ? appt.patientName : appt.doctorName}</h3>
                  {appt.tokenNumber && (
                    <span className="token-chip">Token #{appt.tokenNumber}</span>
                  )}
                </div>

                {!isDoctor && (
                  <>
                    <p className="hospital-name">🏥 {appt.hospital}</p>
                    <p>{appt.specialization}</p>
                  </>
                )}

                <p>
                  Date: {appt.appointmentDate} | Time: {appt.appointmentTime}
                </p>

                <span
                  className={`status-badge ${
                    displayStatus === "Cancelled"
                      ? "cancelled"
                      : displayStatus === "Completed"
                      ? "completed"
                      : "upcoming"
                  }`}
                >
                  {displayStatus}
                </span>

                {/* Patient reports */}
                <div className="reports-section">
                  <p className="reports-title">
                    📄 {isDoctor ? "Patient Reports" : "My Medical Reports"} ({reports.length})
                  </p>

                  {reports.length === 0 ? (
                    <p className="reports-empty">No reports uploaded yet.</p>
                  ) : (
                    <ul className="reports-list">
                      {reports.map((report) => (
                        <li key={report._id}>
                          <FileLink
                            filePath={report.filePath}
                            label={report.originalName}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Upload Upcoming appointments ki matrame */}
                  {!isDoctor && displayStatus === "Upcoming" && (
                    <label className="upload-label">
                      {uploadingId === appt._id ? "Uploading..." : "＋ Upload Report"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={uploadingId === appt._id}
                        onChange={(e) => {
                          handleReportUpload(appt._id, e.target.files[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}

                  {!isDoctor && displayStatus !== "Upcoming" && (
                    <p className="reports-locked">
                      Reports can only be added to upcoming appointments.
                    </p>
                  )}
                </div>

                {/* Doctor prescriptions (cancelled appointments ki chupinchaledu) */}
                {appt.status !== "Cancelled" && (
                  <div className="prescriptions-section">
                    <p className="prescriptions-title">
                      💊 Prescriptions ({prescriptions.length})
                    </p>

                    {prescriptions.length === 0 ? (
                      <p className="reports-empty">
                        {getPrescriptionMessage(appt, canAddPrescription, today)}
                      </p>
                    ) : (
                      <ul className="reports-list">
                        {prescriptions.map((rx) => (
                          <li key={rx._id}>
                            <FileLink
                              filePath={rx.filePath}
                              label={rx.originalName}
                            />
                          </li>
                        ))}
                      </ul>
                    )}

                    {canAddPrescription && (
                      <>
                        <label className="upload-label green">
                          {uploadingRxId === appt._id
                            ? "Uploading..."
                            : "＋ Upload Prescription"}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploadingRxId === appt._id}
                            onChange={(e) => {
                              handlePrescriptionUpload(appt._id, e.target.files[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <p className="reports-locked">
                          Upload the prescription first, then mark the appointment as completed.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Doctor side: patient ichina review (Completed appointments ki) */}
                {isDoctor && appt.status === "Completed" && (
                  <div className="review-box">
                    <p className="review-box-title">Patient's review</p>

                    {myReview ? (
                      <>
                        <StarRating value={myReview.rating} />
                        <span className="muted"> {myReview.reviewerName}</span>
                        {myReview.comment ? (
                          <p className="review-comment">{myReview.comment}</p>
                        ) : (
                          <p className="muted">No comment added.</p>
                        )}
                      </>
                    ) : (
                      <p className="muted">No review from the patient yet.</p>
                    )}
                  </div>
                )}

                {/* Patient side: rating & review */}
                {!isDoctor && appt.status === "Completed" && (
                  <div className="review-box">
                    {myReview ? (
                      <>
                        <p className="review-box-title">Your review</p>
                        <StarRating value={myReview.rating} />
                        {myReview.comment && (
                          <p className="review-comment">{myReview.comment}</p>
                        )}
                      </>
                    ) : reviewFormId === appt._id ? (
                      <form onSubmit={(e) => handleReviewSubmit(e, appt._id)}>
                        <p className="review-box-title">
                          How was your visit with {appt.doctorName}?
                        </p>

                        <div className="star-picker">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              type="button"
                              key={n}
                              className={`star-btn ${n <= reviewRating ? "on" : ""}`}
                              onClick={() => {
                                setReviewRating(n);
                                setReviewError("");
                              }}
                              aria-label={`${n} star${n > 1 ? "s" : ""}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>

                        <textarea
                          className="review-textarea"
                          placeholder="Share your experience (optional)"
                          maxLength={500}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                        />

                        {reviewError && (
                          <p className="form-error">⚠️ {reviewError}</p>
                        )}

                        <div className="admin-actions">
                          <button type="submit" disabled={submittingReview}>
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                          <button
                            type="button"
                            className="cancel-btn-secondary"
                            onClick={closeReviewForm}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="rate-btn"
                        onClick={() => openReviewForm(appt._id)}
                      >
                        ⭐ Rate this visit
                      </button>
                    )}
                  </div>
                )}

                {/* Date gadichipoyindi kani doctor inka Completed ani mark cheyaledu */}
                {!isDoctor &&
                  displayStatus === "Completed" &&
                  appt.status !== "Completed" && (
                    <p className="reports-locked">
                      You can rate this visit once the doctor marks it completed.
                    </p>
                  )}

                {displayStatus === "Upcoming" && !isDoctor && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancel(appt._id)}
                  >
                    Cancel Appointment
                  </button>
                )}

                {displayStatus === "Upcoming" && isDoctor && (
                  <button
                    className="complete-btn"
                    onClick={() => handleComplete(appt._id)}
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AppointmentHistory;