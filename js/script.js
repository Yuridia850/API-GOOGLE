function handleCredentialResponse(response) {
  const token = response.credential;
  console.log("Token recibido:", token);

  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log("Datos del usuario:", payload);

  document.getElementById("user-info").innerHTML = `
    <h3>Hola, ${payload.name}</h3>
    <img src="${payload.picture}" alt="Foto de perfil" style="width:100px; border-radius:50%;"/>
    <p>Email: ${payload.email}</p>
  `;

  document.getElementById("logout-btn").style.display = "inline-block";
  document.querySelector(".g_id_signin").style.display = "none";
}

document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("user-info").innerHTML = "";
  document.getElementById("logout-btn").style.display = "none";


  document.querySelector(".g_id_signin").style.display = "";


  alert("Sesión cerrada.");
});
