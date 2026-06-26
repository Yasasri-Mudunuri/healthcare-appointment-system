import doctors from "../data/doctors";
import DoctorCard from "../components/DoctorCard";

function Doctors() {
  return (
    <div>
      <h1>Doctors List</h1>

      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  );
}

export default Doctors;