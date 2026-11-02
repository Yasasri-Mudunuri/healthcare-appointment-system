import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import StarRating from "../components/StarRating";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const to12h = (time) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const formatReviewDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const INITIAL_REVIEWS = 3;

function DoctorDetails() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState({
    averageRating: 0,
    reviewCount: 0,
    reviews: [],
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await API.get(`/doctors/${id}`);
        setDoctor(res.data);
      } catch (error) {
        console.error("Error fetching doctor:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await API.get(`/reviews/doctor/${id}`);
        setReviewData(res.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchDoctor();
    fetchReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="detail-page">
        <div className="detail-card">
          <h2>Doctor Not Found</h2>
          <Link to="/doctors" className="back-link-inline">
            ⬅ Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  const a = doctor.availability;
  const visibleReviews = showAll
    ? reviewData.reviews
    : reviewData.reviews.slice(0, INITIAL_REVIEWS);

  return (
    <div className="detail-page">
      <div className="detail-card">
        <div className="detail-icon">🩺</div>

        <h1>{doctor.name}</h1>

        <div className="detail-info">
          <p>
            <strong>Hospital:</strong> {doctor.hospital}
          </p>
          <p>
            <strong>Address:</strong> {doctor.address}
          </p>
          <p>
            <strong>Specialization:</strong> {doctor.specialization}
          </p>
          <p>
            <strong>Experience:</strong> {doctor.experience}
          </p>
          <p>
            <strong>Consultation Fee:</strong> ₹{doctor.fee}
          </p>

          {a && (
            <>
              <p>
                <strong>Available:</strong>{" "}
                {a.days.map((d) => DAY_NAMES[d]).join(", ")}
              </p>
              <p>
                <strong>Timings:</strong> {to12h(a.startTime)} – {to12h(a.endTime)}
                {a.breakStart && a.breakEnd && (
                  <> (break {to12h(a.breakStart)} – {to12h(a.breakEnd)})</>
                )}
              </p>
            </>
          )}
        </div>

        <div className="reviews-section">
          <p className="reviews-title">⭐ Ratings & reviews</p>

          {reviewData.reviewCount === 0 ? (
            <p className="muted">No reviews yet.</p>
          ) : (
            <>
              <p className="rating-summary">
                <StarRating value={reviewData.averageRating} />{" "}
                <strong>{Number(reviewData.averageRating).toFixed(1)}</strong>{" "}
                <span className="muted">
                  · {reviewData.reviewCount}{" "}
                  {reviewData.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </p>

              {visibleReviews.map((r) => (
                <div key={r._id} className="review-item">
                  <div className="review-meta">
                    <StarRating value={r.rating} />
                    <span className="muted">
                      {r.reviewerName} · {formatReviewDate(r.createdAt)}
                    </span>
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </div>
              ))}

              {reviewData.reviews.length > INITIAL_REVIEWS && (
                <button
                  type="button"
                  className="show-more-btn"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? "Show fewer"
                    : `Show all (${reviewData.reviews.length})`}
                </button>
              )}
            </>
          )}
        </div>

        <div className="book-btn-row">
          <Link to="/doctors" className="back-link-inline">
            ⬅ Back
          </Link>

          <Link to={`/book/${doctor._id}`} className="book-link">
            <button>Book Appointment</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DoctorDetails;