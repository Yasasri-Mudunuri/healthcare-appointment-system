import API from "../api/axios";

// Protected file ni token tho fetch chesi, kotha tab lo open chestundi.
// filePath: DB lo unna "/uploads/<filename>"
function FileLink({ filePath, label }) {
  const handleOpen = async () => {
    const filename = filePath.split("/").pop();

    // Click ayina ventane tab open chestam (popup blocker aapakundaa). File vachaka daanilo load chestam
    const newTab = window.open("", "_blank");

    try {
      const res = await API.get(`/files/${filename}`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);

      if (newTab) {
        newTab.location.href = blobUrl;
      } else {
        window.location.href = blobUrl;
      }

      // Konchem samayam tarvata memory free
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10 * 60 * 1000);
    } catch (error) {
      if (newTab) newTab.close();

      const status = error.response?.status;

      if (status === 401 || status === 403) {
        alert("You do not have access to this file.");
      } else if (status === 404) {
        alert("This file could not be found.");
      } else {
        alert("Could not open the file. Please try again.");
      }
    }
  };

  return (
    <button type="button" className="file-link" onClick={handleOpen}>
      {label}
    </button>
  );
}

export default FileLink;