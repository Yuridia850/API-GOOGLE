const CLIENT_ID = '488928366738-0g2aoip3o91rq4ae9u305sqp5lka0it7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCJF2jf9KoIzoIXIsSZCxIfpXiBMtErW3Q';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let participantesCrear = [];
let participantesEditar = [];

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
        const participantes = evento.attendees ? evento.attendees.map(attendee => attendee.email) : [];

        const eventoGoogle = {
          nombreEvento,
          fechaEvento,
          inicioEvento,
          finEvento,
          lugarEvento,
          descripcionEvento,
          participantes,
          esEventoGoogle: true,
          googleEventId: evento.id
        };

        mostrarEvento(eventoGoogle);
        guardarEventoStorage(eventoGoogle);
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

    if (evento.participantes && evento.participantes.length > 0) {
      event.attendees = evento.participantes.map(email => ({ 
        email: email,
        responseStatus: 'needsAction'
      }));
    }

    const response = await gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event,
      'sendNotifications': true
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

async function editarEventoEnGoogleCalendar(eventId, evento, participantesOriginales = []) {
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

    const participantesActuales = evento.participantes || [];
    const participantesEliminados = participantesOriginales.filter(
      email => !participantesActuales.includes(email)
    );

    if (participantesActuales.length > 0) {
      event.attendees = participantesActuales.map(email => ({ 
        email: email,
        responseStatus: 'needsAction'
      }));
    }


    if (participantesEliminados.length > 0) {
      console.log('Participantes que serán desinvitados:', participantesEliminados);
    }

    const response = await gapi.client.calendar.events.update({
      'calendarId': 'primary',
      'eventId': eventId,
      'resource': event,
      'sendNotifications': true
    });

    console.log("Evento editado en Google Calendar:", response);
    if (participantesEliminados.length > 0) {
      console.log(`Se enviaron notificaciones de cancelación a: ${participantesEliminados.join(', ')}`);
    }
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
    participantesCrear = [];
    actualizarListaParticipantes('lista-participantes', participantesCrear);
})

document.getElementById("cerrar-modal").addEventListener("click", () => {
    document.getElementById("modal-formulario").classList.add("hidden");
s})

document.getElementById("formulario-evento").addEventListener("submit", function (e) {
    e.preventDefault();

    const nombreEvento = document.getElementById("nombre-evento").value;
    const fechaEvento = document.getElementById("fecha-evento").value;
    const inicioEvento = document.getElementById("inicio-evento").value;
    const finEvento = document.getElementById("fin-evento").value;
    const lugarEvento = document.getElementById("lugar-evento").value;
    const descripcionEvento = document.getElementById("descripcion-evento").value;

    crearContenedor(nombreEvento, fechaEvento, inicioEvento, finEvento, lugarEvento, descripcionEvento, participantesCrear);

    document.getElementById("modal-formulario").classList.add("hidden");
    participantesCrear = [];
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

async function crearContenedor(nombreEvento, fechaEvento, inicioEvento, finEvento, lugarEvento, descripcionEvento, participantes = []) {
    const nuevoEvento = {
        nombreEvento,
        fechaEvento,
        inicioEvento,
        finEvento,
        lugarEvento,
        descripcionEvento,
        participantes
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


let eventosYaCargados = false;

async function cargarTodosLosEventos() {
  const container = document.getElementById("container-eventos");
  container.innerHTML = "";

  try {
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 100,
      'orderBy': 'startTime'
    });

    let eventosGoogle = (response.result.items || []).map(evento => {
      const nombreEvento = evento.summary || "Sin título";
      const fechaEvento = evento.start?.dateTime ? evento.start.dateTime.split('T')[0] : evento.start?.date || "";
      const inicioEvento = evento.start?.dateTime ? new Date(evento.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
      const finEvento = evento.end?.dateTime ? new Date(evento.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
      const lugarEvento = evento.location || "";
      const descripcionEvento = evento.description || "";

      return {
        nombreEvento,
        fechaEvento,
        inicioEvento,
        finEvento,
        lugarEvento,
        descripcionEvento,
        esEventoGoogle: true,
        googleEventId: evento.id
      };
    });

    eventosGoogle.sort((a, b) => {
      const aDate = new Date(`${a.fechaEvento}T${convertirHoraA24(a.inicioEvento) || "00:00"}`);
      const bDate = new Date(`${b.fechaEvento}T${convertirHoraA24(b.inicioEvento) || "00:00"}`);
      return bDate - aDate;
    });

    let ultimoMesAnio = null;
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    eventosGoogle.forEach(evento => {
      const fecha = new Date(evento.fechaEvento);
      const mesAnio = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;

      if (mesAnio !== ultimoMesAnio) {
        const encabezado = document.createElement("h1");
        encabezado.className = "Mes-Año";
        encabezado.textContent = mesAnio;
        container.appendChild(encabezado);
        ultimoMesAnio = mesAnio;
      }

      const nuevoEvento = document.createElement("div");
      nuevoEvento.classList.add("info-eventos");
      if (evento.esEventoGoogle) nuevoEvento.classList.add("evento-google");
      if (evento.googleEventId) nuevoEvento.setAttribute('data-google-event-id', evento.googleEventId);

      const inicioFormateado = formatearHora(evento.inicioEvento);
      const finFormateado = formatearHora(evento.finEvento);

      nuevoEvento.innerHTML = `
        <h1 class="eventos">${evento.nombreEvento}</h1>
        <div class="evento-row">
            <h1 class="hora">${inicioFormateado} - ${finFormateado}</h1>
            <h1 class="fecha">${FechaLocal(evento.fechaEvento)}</h1>
        </div>
        <h1 class="ubicacion">${evento.lugarEvento}</h1>
        <p class="texto">${evento.descripcionEvento}</p>
        <div class="control-row">
            <button class="editar" onclick="editarContenedor(this)">Editar</button>
            <button class="eliminacion" onclick="eliminarContenedor(this)">Eliminar</button>
        </div>
      `;

      container.appendChild(nuevoEvento);
    });

  } catch (error) {
    console.error("Error al obtener eventos de Google Calendar:", error);
  }

  const encabezados = document.querySelectorAll(".Mes-Año");

      if (location.hash) {
        const hash = decodeURIComponent(location.hash.substring(1));
        const mesAnio = hash.replace("_", " ");
        let encontrado = false;

        encabezados.forEach(h1 => {
          if (h1.textContent.trim() === mesAnio) {
            h1.scrollIntoView({ behavior: "smooth", block: "start" });
            encontrado = true;
          }
        });

        if (!encontrado) {
          console.log("No se encontró el mes y año en los encabezados");
        }
      } else {
        const fechaActual = new Date();
        const meses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const mesAnioActual = `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
        let encontrado = false;

        encabezados.forEach(h1 => {
          if (h1.textContent.trim() === mesAnioActual) {
            h1.scrollIntoView({ behavior: "smooth", block: "start" });
            encontrado = true;
          }
        });

        if (!encontrado) {
          console.log("No se encontró el mes y año en los encabezados");
        }
      }


}

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
    const fechaDisplay = contenedorEditar.querySelector(".fecha").textContent;
    
    const inicioEvento24 = convertirHoraA24(inicioEventoDisplay);
    const finEvento24 = convertirHoraA24(finEventoDisplay);
    

    let fechaOriginal = convertirFechaDisplayAISO(fechaDisplay);
    let participantesOriginales = [];
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const googleEventId = contenedorEditar.getAttribute('data-google-event-id');
    
    if (googleEventId) {
        const eventoEncontrado = eventos.find(e => e.googleEventId === googleEventId);
        if (eventoEncontrado && eventoEncontrado.fechaEvento) {
            fechaOriginal = eventoEncontrado.fechaEvento;
        }
        if (eventoEncontrado) {
            participantesOriginales = eventoEncontrado.participantes || [];
        }
    } else {
        const eventoEncontrado = eventos.find(e => 
            e.nombreEvento === nombre && 
            e.lugarEvento === ubicacion
        );
        if (eventoEncontrado) {
            fechaOriginal = eventoEncontrado.fechaEvento;
            participantesOriginales = eventoEncontrado.participantes || [];
        }
    }
    
    document.getElementById("editar-nombre-evento").value = nombre;
    document.getElementById("editar-fecha-evento").value = fechaOriginal;
    document.getElementById("editar-inicio-evento").value = inicioEvento24;
    document.getElementById("editar-fin-evento").value = finEvento24;
    document.getElementById("editar-lugar-evento").value = ubicacion;
    document.getElementById("editar-descripcion-evento").value = descripcion;
    
    window.participantesOriginalesEdicion = [...participantesOriginales];
    participantesEditar = [...participantesOriginales];
    actualizarListaParticipantes('lista-participantes-editar', participantesEditar);
    
    document.getElementById("modal-editar-evento").classList.remove("hidden");
}

function convertirFechaDisplayAISO(fechaDisplay) {
    const meses = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
    };
    
    const partes = fechaDisplay.toLowerCase().split(' ');
    
    if (partes.length >= 5) {
        const dia = partes[1].replace(',', '').padStart(2, '0');
        const mesNombre = partes[3];
        const año = partes[5];
        const mesNumero = meses[mesNombre];
        
        if (mesNumero) {
            return `${año}-${mesNumero}-${dia}`;
        }
    }
    
    return new Date().toISOString().split('T')[0];
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
        participantes: participantesEditar,
        googleEventId: googleEventId,
        esEventoGoogle: !!googleEventId
    };
    
    if (googleEventId) {
        const participantesOriginales = window.participantesOriginalesEdicion || [];
        const exitoGoogle = await editarEventoEnGoogleCalendar(googleEventId, eventoEditado, participantesOriginales);
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
    participantesEditar = [];
    window.participantesOriginalesEdicion = [];
    
    this.reset();
});

const api_KEY = "b89328181447414395b15d08230e986e";

function activarAutocomplete(input) {
  const suggestionBox = document.createElement("div");
  suggestionBox.className = "autocomplete-items";

  input.parentNode.style.position = "relative";
  input.parentNode.appendChild(suggestionBox);

  let debounceTimer;

  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 3) {
      suggestionBox.style.display = "none";
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${api_KEY}`
        );
        const data = await res.json();

        suggestionBox.innerHTML = "";

        if (data.features.length > 0) {
          data.features.forEach((item) => {
            const suggestion = document.createElement("div");
            suggestion.textContent = item.properties.formatted;
            suggestion.className = "autocomplete-option";

            suggestion.addEventListener("click", () => {
              input.value = item.properties.formatted;
              suggestionBox.style.display = "none";
            });

            suggestionBox.appendChild(suggestion);
          });
          suggestionBox.style.display = "block";
        } else {
          suggestionBox.style.display = "none";
        }
      } catch (error) {
        console.error("Error en autocomplete:", error);
      }
    }, 300);
  });

  document.addEventListener("click", (e) => {
    if (!suggestionBox.contains(e.target) && e.target !== input) {
      suggestionBox.style.display = "none";
    }
  });
}

activarAutocomplete(document.getElementById("lugar-evento"));
activarAutocomplete(document.getElementById("editar-lugar-evento"));


// Función para animar la barra de progreso
function animateProgressBar(progressBarElement, duration) {
  return new Promise((resolve) => {
    let start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      progressBarElement.style.width = (progress * 100) + "%";

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    window.requestAnimationFrame(step);
  });
}

const formularioCrear = document.getElementById("formulario-evento");
const btnGuardarCrear = document.getElementById("btn-guardar");
const progressBarCrear = document.getElementById("progress-bar-fill");
const progressBarContainerCrear = document.getElementById("progress-bar-crear");

formularioCrear.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnGuardarCrear.disabled = true;
  progressBarContainerCrear.classList.remove("hidden");
  progressBarCrear.style.width = "25%";

  await animateProgressBar(progressBarCrear, 50);

  btnGuardarCrear.disabled = false;
  progressBarContainerCrear.classList.add("hidden");
  progressBarCrear.style.width = "0%";
});

const formularioEditar = document.getElementById("formulario-editar-evento");
const btnGuardarEditar = document.getElementById("btn-guardar-edicion");
const progressBarEditar = document.getElementById("progress-bar-fill-editar");
const progressBarContainerEditar = document.getElementById("progress-bar-editar");

formularioEditar.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnGuardarEditar.disabled = true;
  progressBarContainerEditar.classList.remove("hidden");
  progressBarEditar.style.width = "25%";

  await animateProgressBar(progressBarEditar, 50);

  btnGuardarEditar.disabled = false;
  progressBarContainerEditar.classList.add("hidden");
  progressBarEditar.style.width = "0%";

});

function agregarParticipante(inputId, listaId, arrayParticipantes) {
    const emailInput = document.getElementById(inputId);
    const email = emailInput.value.trim();
    
    if (email && validarEmail(email)) {
        if (!arrayParticipantes.includes(email)) {
            arrayParticipantes.push(email);
            actualizarListaParticipantes(listaId, arrayParticipantes);
            emailInput.value = '';
        } else {
            alert('Este email ya está en la lista');
        }
    } else {
        alert('Por favor ingresa un email válido');
    }
}

function eliminarParticipante(email, listaId, arrayParticipantes) {
    const index = arrayParticipantes.indexOf(email);
    if (index > -1) {
        arrayParticipantes.splice(index, 1);
        actualizarListaParticipantes(listaId, arrayParticipantes);
    }
}

function actualizarListaParticipantes(listaId, arrayParticipantes) {
    const lista = document.getElementById(listaId);
    lista.innerHTML = '';
    
    arrayParticipantes.forEach(email => {
        const participanteDiv = document.createElement('div');
        participanteDiv.className = 'participante-item';
        
        participanteDiv.innerHTML = `
            <span class="participante-email">${email}</span>
            <button type="button" class="btn-eliminar-participante" onclick="eliminarParticipante('${email}', '${listaId}', ${listaId.includes('editar') ? 'participantesEditar' : 'participantesCrear'})">×</button>
        `;
        
        lista.appendChild(participanteDiv);
    });
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

document.getElementById('btn-agregar-participante').addEventListener('click', () => {
    agregarParticipante('email-participante', 'lista-participantes', participantesCrear);
});

document.getElementById('btn-agregar-participante-editar').addEventListener('click', () => {
    agregarParticipante('editar-email-participante', 'lista-participantes-editar', participantesEditar);
});

document.getElementById('email-participante').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        agregarParticipante('email-participante', 'lista-participantes', participantesCrear);
    }
});

document.getElementById('editar-email-participante').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        agregarParticipante('editar-email-participante', 'lista-participantes-editar', participantesEditar);
    }
});

function guardarEventoStorage(evento) {
    let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    
    if (evento.googleEventId) {
        const index = eventos.findIndex(e => e.googleEventId === evento.googleEventId);
        if (index !== -1) {
            eventos[index] = evento;
        } else {
            eventos.push(evento);
        }
    } else {
        eventos.push(evento);
    }
    
    localStorage.setItem("eventos", JSON.stringify(eventos));
}

