import { Link } from "react-router-dom";

function DoctorCard({ doctor }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <h3>{doctor.name}</h3>
      <p>{doctor.specialization}</p>
      <p>{doctor.experience}</p>

      <Link to={`/doctor/${doctor.id}`}>
        <button>View Details</button>
      </Link>
    </div>
  );
}

export default DoctorCard;