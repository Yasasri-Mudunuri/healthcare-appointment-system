import { Link } from "react-router-dom";
import StarRating from "./StarRating";

function DoctorCard({ doctor }) {
  const hasReviews = doctor.reviewCount > 0;

  return (
    <div className="card">
      <h3>{doctor.name}</h3>

      <p>{doctor.specialization}</p>

      <p className="hospital-name">🏥 {doctor.hospital}</p>

      {doctor.address && (
        <p className="hospital-name">📍 {doctor.address}</p>
      )}

      <p>{doctor.experience}</p>

      {hasReviews ? (
        <p className="rating-line">
          <StarRating value={doctor.averageRating} />{" "}
          <strong>{Number(doctor.averageRating).toFixed(1)}</strong>{" "}
          <span className="muted">({doctor.reviewCount})</span>
        </p>
      ) : (
        <p className="rating-line muted">No reviews yet</p>
      )}

      <Link to={`/doctor/${doctor._id}`}>
        <button>View Details</button>
      </Link>
    </div>
  );
}

export default DoctorCard;