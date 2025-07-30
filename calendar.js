const token = sessionStorage.getItem("token");
if (!token) {
  location.href = "index.html"
}

const payload = JSON.parse(atob(token.split('.')[1]));

logo.setAttribute("src", payload?.picture || "Img/calendar_logo.png")
text_logo.innerText = payload?.name || "Usuario";

document.getElementById('cerrarSesion').addEventListener('click', function () {
  document.getElementById('popup-confirm').classList.remove('hidden');
});

document.getElementById('confirm-yes').addEventListener('click', function () {
  sessionStorage.removeItem("token")
  location.href = "index.html"
});

document.getElementById('confirm-no').addEventListener('click', function () {
  document.getElementById('popup-confirm').classList.add('hidden');
});
