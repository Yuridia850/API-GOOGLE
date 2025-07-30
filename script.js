const token = sessionStorage.getItem("token");
if (token) {
  location.href = "calendar.html"
}

function handleCredentialResponse (response) {
  const token = response.credential;
  sessionStorage.setItem("token", token)
  location.href = "calendar.html"
}

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("token");
  location.href = "index.html";
});
