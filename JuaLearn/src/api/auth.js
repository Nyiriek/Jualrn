import api from "./axios";

export async function loginUser({ username, password }) {
  const res = await api.post("/token/", { username, password });
  localStorage.setItem("accessToken", res.data.access);
  localStorage.setItem("refreshToken", res.data.refresh);
  return res.data;
}

export function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
}
