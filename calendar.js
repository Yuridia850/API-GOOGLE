const CLIENT_ID = '488928366738-0g2aoip3o91rq4ae9u305sqp5lka0it7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCJF2jf9KoIzoIXIsSZCxIfpXiBMtErW3Q';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });

  const token = sessionStorage.getItem("token");
  if (token) {
    gapi.client.setToken({ access_token: token });
  } else {
    location.href = "index.html";
  }
}

window.gapiLoaded = gapiLoaded;

document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    location.href = "index.html";
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));

  const logo = document.getElementById('logo');
  const text_logo = document.getElementById('text_logo');

  logo.setAttribute("src", payload?.picture || "Img/calendar_logo.png");
  text_logo.innerText = payload?.name || "Usuario";

  document.getElementById('cerrarSesion').addEventListener('click', function () {
    document.getElementById('popup-confirm').classList.remove('hidden');
  });

  document.getElementById('confirm-yes').addEventListener('click', function () {
    sessionStorage.removeItem("token");
    location.href = "index.html";
  });

  document.getElementById('confirm-no').addEventListener('click', function () {
    document.getElementById('popup-confirm').classList.add('hidden');
  });
});
