const CLIENT_ID = '488928366738-0g2aoip3o91rq4ae9u305sqp5lka0it7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCJF2jf9KoIzoIXIsSZCxIfpXiBMtErW3Q';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

async function cargarEventosGoogleCalendar() {
  try {

    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 50,
      'orderBy': 'startTime'
    });

    const eventos = response.result.items;
    if (eventos && Array.isArray(eventos)) {
      eventos.forEach(evento => {
        const nombreEvento = evento.summary || "Sin título";
        const fechaEvento = evento.start?.date || evento.start?.dateTime || "";
        const inicioEvento = evento.start?.dateTime ? new Date(evento.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
        const finEvento = evento.end?.dateTime ? new Date(evento.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
        const lugarEvento = evento.location || "";
        const descripcionEvento = evento.description || "";

        const eventoGoogle = {
          nombreEvento,
          fechaEvento,
          inicioEvento,
          finEvento,
          lugarEvento,
          descripcionEvento,
          esEventoGoogle: true
        };

        mostrarEvento(eventoGoogle);
      });
    }
  } catch (error) {
    console.error("Error al obtener eventos del calendario:", error);
  }
}

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });

  const token = sessionStorage.getItem("token");
  const accessToken = sessionStorage.getItem("access_token");
  
  if (token && accessToken) {

    gapi.client.setToken({ access_token: accessToken });
    if (!eventosYaCargados) {
      cargarTodosLosEventos();
    }
  } else {
    location.href = "index.html";
  }
}

window.gapiLoaded = gapiLoaded;

document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem("token");
  const accessToken = sessionStorage.getItem("access_token");
  
  if (!token || !accessToken) {
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
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user_email");
    location.href = "index.html";
  });

  document.getElementById('confirm-no').addEventListener('click', function () {
    document.getElementById('popup-confirm').classList.add('hidden');
  });
});

document.getElementById("btn-crear").addEventListener("click", () => {
    document.getElementById("modal-formulario").classList.remove("hidden");
})

document.getElementById("cerrar-modal").addEventListener("click", () => {
    document.getElementById("modal-formulario").classList.add("hidden");
})

document.getElementById("formulario-evento").addEventListener("submit", function (e) {
    e.preventDefault();

    const nombreEvento = document.getElementById("nombre-evento").value;
    const fechaEvento = document.getElementById("fecha-evento").value;
    const inicioEvento = document.getElementById("inicio-evento").value;
    const finEvento = document.getElementById("fin-evento").value;
    const lugarEvento = document.getElementById("lugar-evento").value;
    const descripcionEvento = document.getElementById("descripcion-evento").value;

    crearContenedor(nombreEvento, fechaEvento, inicioEvento, finEvento, lugarEvento, descripcionEvento);

    document.getElementById("modal-formulario").classList.add("hidden");

    this.reset();
});

function FechaLocal(fechaISO) {
    const fechaGeneral = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaISO).toLocaleDateString('es-MX', fechaGeneral); 
}

function crearContenedor(nombreEvento, fechaEvento, inicioEvento, finEvento, lugarEvento, descripcionEvento) {
    const nuevoEvento = {
        nombreEvento,
        fechaEvento,
        inicioEvento,
        finEvento,
        lugarEvento,
        descripcionEvento
    };

    mostrarEvento(nuevoEvento);
    guardarEventoStorage(nuevoEvento); 
}

function mostrarEvento(evento) {
    const nuevoEvento = document.createElement("div");
    nuevoEvento.classList.add("info-eventos");
    
    if (evento.esEventoGoogle) {
        nuevoEvento.classList.add("evento-google");
    }

    nuevoEvento.innerHTML = `            
    
    <h1 class="fecha">${FechaLocal(evento.fechaEvento)}</h1>

    <div class="evento-row">
        <h1 class="hora">${evento.inicioEvento} - ${evento.finEvento}</h1>
        <h1 class="eventos">${evento.nombreEvento}</h1>
    </div>
                
    <h1 class="ubicacion">${evento.lugarEvento}</h1>

    </h1><p class="texto">${evento.descripcionEvento}</p>

        <div class="control-row">
        ${!evento.esEventoGoogle ? '<button class="eliminacion" onclick="eliminarContenedor(this)">Eliminar</button>' : '<span class="evento-google-label">Evento de Google Calendar</span>'}
    </div>

    `;

    document.getElementById("container-eventos").appendChild(nuevoEvento);
}

function guardarEventoStorage(evento) {
    let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    eventos.push(evento);
    localStorage.setItem("eventos", JSON.stringify(eventos));
}

function cargarEventosStorage() {
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    eventos.forEach(evento => mostrarEvento(evento));
}

let eventosYaCargados = false;

function cargarTodosLosEventos() {
    if (eventosYaCargados) return; 
    

    const container = document.getElementById("container-eventos");
    container.innerHTML = "";
    

    cargarEventosStorage();
    

    cargarEventosGoogleCalendar();
    
    eventosYaCargados = true;
}

window.addEventListener("DOMContentLoaded", () => {

});

let contenedorEliminar = null;

function eliminarContenedor(boton){
    contenedorEliminar = boton.closest(".info-eventos");
    document.getElementById("modal-confirmacion-eliminar").style.display = "flex";
}    

document.getElementById("btn-confirmar").addEventListener("click", () => {
    if (contenedorEliminar) {
        const nombre = contenedorEliminar.querySelector(".eventos").textContent;
        const hora = contenedorEliminar.querySelector(".hora").textContent;
        const fecha = contenedorEliminar.querySelector(".fecha").textContent;

        let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

        eventos = eventos.filter(e => 
            !(e.nombreEvento === nombre && 
              `${e.inicioEvento} - ${e.finEvento}` === hora &&
              FechaLocal(e.fechaEvento) === fecha)
        );

        localStorage.setItem("eventos", JSON.stringify(eventos));

        contenedorEliminar.remove();
        contenedorEliminar = null;
    }

    document.getElementById("modal-confirmacion-eliminar").style.display = "none";
});

document.getElementById("btn-cancelar").addEventListener("click", () => {
    contenedorEliminar = null;
    document.getElementById("modal-confirmacion-eliminar").style.display = "none";
});
