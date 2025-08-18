const { google } = require("googleapis");

// Configurar autenticación usando variable de entorno o archivo local
let auth;
if (process.env.GOOGLE_CREDENTIALS) {
  // Para producción (deploy)
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
} else {
  // Para desarrollo local
  const path = require("path");
  auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credenciales", "appturnos-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

async function crearEvento({ nombre, telefono, fecha, hora }) {
  const authClient = await auth.getClient();
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const startDateTime = new Date(`${fecha}T${hora}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 min

  const evento = {
    summary: `Turno con ${nombre}`,
    description: `Teléfono: ${telefono}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "America/Argentina/Buenos_Aires",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "America/Argentina/Buenos_Aires",
    },
  };

  const calendarId = "brunovicente32@gmail.com";

  const response = await calendar.events.insert({
    calendarId,
    requestBody: evento,
  });

  return response.data;
}

module.exports = { crearEvento };
