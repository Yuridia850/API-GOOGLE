const CLIENT_ID = '488928366738-0g2aoip3o91rq4ae9u305sqp5lka0it7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCJF2jf9KoIzoIXIsSZCxIfpXiBMtErW3Q';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

async function cargarEventosGoogleCalendar() {
  try {
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 50,
      'orderBy': 'startTime'
    });

    let eventos = response.result.items;
    if (eventos && Array.isArray(eventos)) {
      eventos = eventos.sort((a, b) => {
        const fechaA = a.start?.dateTime || a.start?.date;
        const fechaB = b.start?.dateTime || b.start?.date;
        return new Date(fechaB) - new Date(fechaA);
      })
      
      eventos.forEach(evento => {
        const nombreEvento = evento.summary || "Sin título";
        const fechaEvento = evento.start?.dateTime ? evento.start.dateTime.split('T')[0] : evento.start?.date || "";
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
          esEventoGoogle: true,
          googleEventId: evento.id
        };

        mostrarEvento(eventoGoogle);
      });
    }
  } catch (error) {
    console.error("Error al obtener eventos del calendario:", error);
  }
}

async function agregarEventoAGoogleCalendar(evento) {
  try {
    const startDate = new Date(`${evento.fechaEvento}T${evento.inicioEvento}:00`);
    const endDate = new Date(`${evento.fechaEvento}T${evento.finEvento}:00`);
    
    const event = {
      'summary': evento.nombreEvento,
      'location': evento.lugarEvento,
      'description': evento.descripcionEvento,
      'start': {
        'dateTime': startDate.toISOString(),
        'timeZone': 'America/Mexico_City'
      },
      'end': {
        'dateTime': endDate.toISOString(),
        'timeZone': 'America/Mexico_City'
      }
    };

    const response = await gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event
    });

    console.log("Evento agregado a Google Calendar:", response);
    return response.result.id;
  } catch (error) {
    console.error("Error al agregar evento a Google Calendar:", error);
    return null;
  }
}

async function eliminarEventoDeGoogleCalendar(eventId) {
  try {
    await gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId
    });
    console.log("Evento eliminado de Google Calendar:", eventId);
    return true;
  } catch (error) {
    console.error("Error al eliminar evento de Google Calendar:", error);
    return false;
  }
}

async function editarEventoEnGoogleCalendar(eventId, evento) {
  try {
    const startDate = new Date(`${evento.fechaEvento}T${evento.inicioEvento}:00`);
    const endDate = new Date(`${evento.fechaEvento}T${evento.finEvento}:00`);
    
    const event = {
      'summary': evento.nombreEvento,
      'location': evento.lugarEvento,
      'description': evento.descripcionEvento,
      'start': {
        'dateTime': startDate.toISOString(),
        'timeZone': 'America/Mexico_City'
      },
      'end': {
        'dateTime': endDate.toISOString(),
        'timeZone': 'America/Mexico_City'
      }
    };

    const response = await gapi.client.calendar.events.update({
      'calendarId': 'primary',
      'eventId': eventId,
      'resource': event
    });

    console.log("Evento editado en Google Calendar:", response);
    return true;
  } catch (error) {
    console.error("Error al editar evento en Google Calendar:", error);
    return false;
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
        fechaISO += 'T00:00:00';
    }

    const fechaGeneral = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaISO + `-06:00`).toLocaleDateString('es-MX', fechaGeneral); 
}

function formatearHora(hora) {
    if (!hora) return "";
    

    if (hora.includes('AM') || hora.includes('PM') || hora.includes('a.m.') || hora.includes('p.m.')) {
        return hora;
    }
    

    const [horas, minutos] = hora.split(':');
    const horasNum = parseInt(horas);
    
    if (horasNum === 0) {
        return `12:${minutos} AM`;
    } else if (horasNum < 12) {
        return `${horasNum}:${minutos} AM`;
    } else if (horasNum === 12) {
        return `12:${minutos} PM`;
    } else {
        return `${horasNum - 12}:${minutos} PM`;
    }
}

function convertirHoraA24(hora) {
    if (!hora) return "";
    
    if (!hora.includes('AM') && !hora.includes('PM') && !hora.includes('a.m.') && !hora.includes('p.m.')) {
        return hora;
    }
    
    hora = hora.trim();
    let esAM = hora.includes('AM') || hora.includes('a.m.');
    let esPM = hora.includes('PM') || hora.includes('p.m.');
    
    let tiempoPuro = hora.replace(/\s*(AM|PM|a\.m\.|p\.m\.)\s*/gi, '');
    let [horas, minutos] = tiempoPuro.split(':');
    
    horas = parseInt(horas);
    
    if (esAM) {
        if (horas === 12) horas = 0;
    } else if (esPM) {
        if (horas !== 12) horas += 12;
    }
    
    return `${horas.toString().padStart(2, '0')}:${minutos}`;
}

async function crearContenedor(nombreEvento, fechaEvento, inicioEvento, finEvento, lugarEvento, descripcionEvento) {
    const nuevoEvento = {
        nombreEvento,
        fechaEvento,
        inicioEvento,
        finEvento,
        lugarEvento,
        descripcionEvento
    };

    const googleEventId = await agregarEventoAGoogleCalendar(nuevoEvento);
    
    if (googleEventId) {
        nuevoEvento.googleEventId = googleEventId;
        nuevoEvento.esEventoGoogle = true;
    }

    mostrarEvento(nuevoEvento);
    guardarEventoStorage(nuevoEvento);
}

function mostrarEvento(evento) {

    const container = document.getElementById("container-eventos");

    const fecha = new Date(evento.fechaEvento);
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const mesAnio = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;

    let encabezado = Array.from(container.getElementsByClassName("Mes-Año"))
        .find(h => h.textContent === mesAnio);

    if (!encabezado) {
        encabezado = document.createElement("h1");
        encabezado.className = "Mes-Año";
        encabezado.textContent = mesAnio;
        container.appendChild(encabezado);
    } 


    const nuevoEvento = document.createElement("div");
    nuevoEvento.classList.add("info-eventos");
    
    if (evento.esEventoGoogle) {
        nuevoEvento.classList.add("evento-google");
    }

    if (evento.googleEventId) {
        nuevoEvento.setAttribute('data-google-event-id', evento.googleEventId);
    }

    const inicioFormateado = formatearHora(evento.inicioEvento);
    const finFormateado = formatearHora(evento.finEvento);

    nuevoEvento.innerHTML = `            
    
    <h1 class="eventos">${evento.nombreEvento}</h1>

    <div class="evento-row">
        <h1 class="hora">${inicioFormateado} - ${finFormateado}</h1>
        <h1 class="fecha">${FechaLocal(evento.fechaEvento)}</h1>
    </div>
                
    <h1 class="ubicacion">${evento.lugarEvento}</h1>

    </h1><p class="texto">${evento.descripcionEvento}</p>

        <div class="control-row">
        <button class="editar" onclick="editarContenedor(this)">Editar</button>
        <button class="eliminacion" onclick="eliminarContenedor(this)">Eliminar</button>
    </div>

    `;

    let siguiente = encabezado.nextSibling;
    while (siguiente && siguiente.classList && siguiente.classList.contains("Mes-Año")) {
        siguiente = siguiente.nextSibling;
    }
    container.insertBefore(nuevoEvento, encabezado.nextSibling);
}

function guardarEventoStorage(evento) {
    let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    eventos.push(evento);
    localStorage.setItem("eventos", JSON.stringify(eventos));
}

function cargarEventosStorage() {
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    eventos.forEach(evento => {

        if (evento.googleEventId) {
            mostrarEvento(evento);
        }
    });
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

document.getElementById("btn-confirmar").addEventListener("click", async () => {
    if (contenedorEliminar) {
        const nombre = contenedorEliminar.querySelector(".eventos").textContent;
        const hora = contenedorEliminar.querySelector(".hora").textContent;
        const fecha = contenedorEliminar.querySelector(".fecha").textContent;
        const googleEventId = contenedorEliminar.getAttribute('data-google-event-id');


        if (googleEventId) {
            const eliminadoDeGoogle = await eliminarEventoDeGoogleCalendar(googleEventId);
            if (!eliminadoDeGoogle) {
                alert("Error al eliminar el evento de Google Calendar");
                document.getElementById("modal-confirmacion-eliminar").style.display = "none";
                return;
            }
        }


        let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
        if (googleEventId) {
            eventos = eventos.filter(e => e.googleEventId !== googleEventId);
        } else {

            eventos = eventos.filter(e => 
                !(e.nombreEvento === nombre && 
                  `${e.inicioEvento} - ${e.finEvento}` === hora &&
                  FechaLocal(e.fechaEvento) === fecha)
            );
        }
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

let contenedorEditar = null;

function editarContenedor(boton) {
    contenedorEditar = boton.closest(".info-eventos");
    
    const nombre = contenedorEditar.querySelector(".eventos").textContent;
    const horaCompleta = contenedorEditar.querySelector(".hora").textContent;
    const [inicioEventoDisplay, finEventoDisplay] = horaCompleta.split(' - ');
    const ubicacion = contenedorEditar.querySelector(".ubicacion").textContent;
    const descripcion = contenedorEditar.querySelector(".texto").textContent;
    
    const inicioEvento24 = convertirHoraA24(inicioEventoDisplay);
    const finEvento24 = convertirHoraA24(finEventoDisplay);
    
    let fechaOriginal = '';
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const googleEventId = contenedorEditar.getAttribute('data-google-event-id');
    
    if (googleEventId) {
        const eventoEncontrado = eventos.find(e => e.googleEventId === googleEventId);
        if (eventoEncontrado) {
            fechaOriginal = eventoEncontrado.fechaEvento;
        }
    } else {
        const eventoEncontrado = eventos.find(e => 
            e.nombreEvento === nombre && 
            e.lugarEvento === ubicacion
        );
        if (eventoEncontrado) {
            fechaOriginal = eventoEncontrado.fechaEvento;
        }
    }
    
    document.getElementById("editar-nombre-evento").value = nombre;
    document.getElementById("editar-fecha-evento").value = fechaOriginal;
    document.getElementById("editar-inicio-evento").value = inicioEvento24;
    document.getElementById("editar-fin-evento").value = finEvento24;
    document.getElementById("editar-lugar-evento").value = ubicacion;
    document.getElementById("editar-descripcion-evento").value = descripcion;
    
    document.getElementById("modal-editar-evento").classList.remove("hidden");
}

document.getElementById("cerrar-modal-editar").addEventListener("click", () => {
    document.getElementById("modal-editar-evento").classList.add("hidden");
    contenedorEditar = null;
});

document.getElementById("formulario-editar-evento").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    if (!contenedorEditar) return;
    
    const nombreEvento = document.getElementById("editar-nombre-evento").value;
    const fechaEvento = document.getElementById("editar-fecha-evento").value;
    const inicioEvento = document.getElementById("editar-inicio-evento").value;
    const finEvento = document.getElementById("editar-fin-evento").value;
    const lugarEvento = document.getElementById("editar-lugar-evento").value;
    const descripcionEvento = document.getElementById("editar-descripcion-evento").value;
    
    const googleEventId = contenedorEditar.getAttribute('data-google-event-id');
    
    const eventoEditado = {
        nombreEvento,
        fechaEvento,
        inicioEvento,
        finEvento,
        lugarEvento,
        descripcionEvento,
        googleEventId: googleEventId,
        esEventoGoogle: !!googleEventId
    };
    

    if (googleEventId) {
        const exitoGoogle = await editarEventoEnGoogleCalendar(googleEventId, eventoEditado);
        if (!exitoGoogle) {
            alert("Error al actualizar el evento en Google Calendar");
            return;
        }
    }
    

    let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    if (googleEventId) {
        const index = eventos.findIndex(e => e.googleEventId === googleEventId);
        if (index !== -1) {
            eventos[index] = eventoEditado;
        }
    } else {

        const nombreOriginal = contenedorEditar.querySelector(".eventos").textContent;
        const horaOriginal = contenedorEditar.querySelector(".hora").textContent;
        const ubicacionOriginal = contenedorEditar.querySelector(".ubicacion").textContent;
        
        const index = eventos.findIndex(e => 
            e.nombreEvento === nombreOriginal && 
            `${e.inicioEvento} - ${e.finEvento}` === horaOriginal &&
            e.lugarEvento === ubicacionOriginal
        );
        if (index !== -1) {
            eventos[index] = eventoEditado;
        }
    }
    localStorage.setItem("eventos", JSON.stringify(eventos));
    

    const inicioFormateado = formatearHora(inicioEvento);
    const finFormateado = formatearHora(finEvento);
    
    contenedorEditar.querySelector(".fecha").textContent = FechaLocal(fechaEvento);
    contenedorEditar.querySelector(".hora").textContent = `${inicioFormateado} - ${finFormateado}`;
    contenedorEditar.querySelector(".eventos").textContent = nombreEvento;
    contenedorEditar.querySelector(".ubicacion").textContent = lugarEvento;
    contenedorEditar.querySelector(".texto").textContent = descripcionEvento;
    

    document.getElementById("modal-editar-evento").classList.add("hidden");
    contenedorEditar = null;
    
    this.reset();
});
