document.getElementById("user-info").style.display = "none";
function handleCredentialResponse(response) {
  const token = response.credential;
  console.log("Token recibido:", token);

  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log("Datos del usuario:", payload);

  document.getElementById("user-info").innerHTML = `
  <div class="login">
    <h3>Hola, ${payload.name}</h3>
    <img src="${payload.picture}" alt="Foto de perfil"/>
    <p>Email: ${payload.email}</p>
  </div>
  `;
  document.getElementById("user-info").style.display = "";

  document.getElementById("logout-btn").style.display = "inline-block";
  document.querySelector(".g_id_signin").style.display = "none";

  document.querySelector(".login-card").style.display = "none";

  alert("¡Cuenta añadida correctamente!");
}

document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("user-info").innerHTML = "";
  document.getElementById("user-info").style.display = "none";
  document.getElementById("logout-btn").style.display = "none";


  document.querySelector(".g_id_signin").style.display = "";

  document.querySelector(".login-card").style.display = "";

 alert("Sesión cerrada.");
  
});