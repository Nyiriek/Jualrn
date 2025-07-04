import axios from "./axios";

export async function loginUser({ username, password }) {
  const res = await axios.post("/api/token/", { username, password });
  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);
  return res.data;
}

export async function fetchUserProfile() {
  const res = await axios.get("/api/user/me/");
  return res.data;
}
