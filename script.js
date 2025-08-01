const CLIENT_ID = '488928366738-0g2aoip3o91rq4ae9u305sqp5lka0it7.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gisInited = false;
let gapiInited = false;

const token = sessionStorage.getItem("token");
const accessToken = sessionStorage.getItem("access_token");
if (token && accessToken) {
  location.href = "calendar.html"
}


function handleCredentialResponse(response) {
  const token = response.credential;
  sessionStorage.setItem("token", token);
  

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userEmail = payload.email;
  sessionStorage.setItem("user_email", userEmail);
  
  
  document.getElementById('oauth-signin').style.display = 'block';
  document.querySelector('.g_id_signin').style.display = 'none';
}


function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: 'AIzaSyCJF2jf9KoIzoIXIsSZCxIfpXiBMtErW3Q',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  });
  gapiInited = true;
  maybeEnableButtons();
}


function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }

      sessionStorage.setItem("access_token", resp.access_token);
      location.href = "calendar.html";
    },
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    const button = document.getElementById('oauth-signin');
    if (button) {
      button.onclick = () => {
        tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
          
    
          try {
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                'Authorization': `Bearer ${resp.access_token}`
              }
            });
            const userInfo = await userInfoResponse.json();
            const storedEmail = sessionStorage.getItem("user_email");
            
            if (userInfo.email !== storedEmail) {
              alert('Error: Debes autorizar con la misma cuenta con la que iniciaste sesión.');
              return;
            }
            
            sessionStorage.setItem("access_token", resp.access_token);
            location.href = "calendar.html";
          } catch (error) {
            console.error('Error verificando la cuenta:', error);
            alert('Error al verificar la cuenta. Inténtalo de nuevo.');
          }
        };


        const userEmail = sessionStorage.getItem("user_email");
        const requestOptions = userEmail ? 
          { prompt: 'consent', hint: userEmail } : 
          { prompt: 'consent' };

        if (gapi.client.getToken() === null) {
          tokenClient.requestAccessToken(requestOptions);
        } else {
          tokenClient.requestAccessToken({ prompt: '', hint: userEmail });
        }
      };
    }
  }
}


window.addEventListener('load', () => {
  if (typeof gapi !== 'undefined') {
    gapiLoaded();
  }
  if (typeof google !== 'undefined') {
    gisLoaded();
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("user_email");
  location.href = "index.html";
});
