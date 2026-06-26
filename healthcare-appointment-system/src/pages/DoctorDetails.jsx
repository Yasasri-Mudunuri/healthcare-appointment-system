import { useParams, Link } from "react-router-dom";
import doctors from "../data/doctors";

function DoctorDetails() {
  const { id } = useParams();

  const doctor = doctors.find(
    (doc) => doc.id === Number(id)
  );

  if (!doctor) {
    return <h2>Doctor Not Found</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>{doctor.name}</h1>

      <p><b>Specialization:</b> {doctor.specialization}</p>
      <p><b>Experience:</b> {doctor.experience}</p>
      <p><b>Fee:</b> ₹{doctor.fee}</p>

      <Link to={`/book/${doctor.id}`}>
      <button>Book Appointment</button>
    </Link>
    </div>
  );
}

export default DoctorDetails;