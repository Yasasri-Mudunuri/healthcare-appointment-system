// Read-only stars. value: 0 - 5 (decimal ayina nearest star ki round avtundi)
function StarRating({ value = 0 }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));

  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="stars-off">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export default StarRating;