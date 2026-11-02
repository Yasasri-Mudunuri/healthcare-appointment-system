import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import API from "../api/axios";

function Doctors() {
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [specialization, setSpecialization] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await API.get("/doctors");
        setDoctors(res.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    setLocation(searchParams.get("location") || "");
  }, [searchParams]);

  const specializations = [
    "All",
    ...new Set(doctors.map((doc) => doc.specialization)),
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesLocation = (doctor.address || "")
      .toLowerCase()
      .includes(location.toLowerCase());

    const matchesSpecialization =
      specialization === "All" || doctor.specialization === specialization;

    return matchesSearch && matchesLocation && matchesSpecialization;
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortBy === "rating") {
      return (
        (b.averageRating || 0) - (a.averageRating || 0) ||
        (b.reviewCount || 0) - (a.reviewCount || 0)
      );
    }

    if (sortBy === "reviews") {
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    }

    return 0;
  });

  if (loading) {
    return (
      <div className="container">
        <h1>Doctors List</h1>
        <p>Loading doctors...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Doctors List</h1>

      {location && (
        <p style={{ color: "#7c3aed", marginBottom: "10px" }}>
          Showing results near: <strong>{location}</strong>
        </p>
      )}

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search doctor by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="text"
          placeholder="Filter by place..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="default">Sort: Default</option>
          <option value="rating">Sort: Highest rated</option>
          <option value="reviews">Sort: Most reviews</option>
        </select>
      </div>

      <div className="doctor-grid">
        {sortedDoctors.length > 0 ? (
          sortedDoctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))
        ) : (
          <p>No doctors found near this location.</p>
        )}
      </div>
    </div>
  );
}

export default Doctors;