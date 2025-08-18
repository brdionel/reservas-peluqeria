const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const { crearEvento } = require("./google");
require("dotenv").config();

const app = express();

// Middleware para CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API de Turnos funcionando correctamente" });
});

app.post("/turno", async (req, res) => {
  const { nombre, telefono, fecha, hora } = req.body;

  if (!nombre || !telefono || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  db.run(
    `INSERT INTO turnos (nombre, telefono, fecha, hora) VALUES (?, ?, ?, ?)`,
    [nombre, telefono, fecha, hora],
    async function (err) {
      if (err) {
        return res.status(500).json({ error: "Error al guardar en DB" });
      }

      try {
        const evento = await crearEvento({ nombre, telefono, fecha, hora });
        res.status(201).json({ id: this.lastID, evento });
      } catch (error) {
        console.error("Error al crear evento en Google Calendar:", error);
        res
          .status(500)
          .json({ error: error.message, details: error.errors || null });
      }
    }
  );
});

// Ruta para obtener todos los turnos
app.get("/turnos", (req, res) => {
  db.all("SELECT * FROM turnos ORDER BY fecha, hora", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener turnos" });
    }
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
