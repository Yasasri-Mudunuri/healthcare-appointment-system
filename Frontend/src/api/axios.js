import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Prati request tho automatic ga token ni add cheyadam
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;