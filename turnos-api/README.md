# 🏪 API de Turnos para Peluquería

API REST para gestión de turnos de peluquería con integración automática a Google Calendar.

## 🚀 Características

- ✅ Crear turnos con validación de datos
- ✅ Almacenamiento en base de datos SQLite
- ✅ Integración automática con Google Calendar
- ✅ API REST con CORS habilitado
- ✅ Listado de turnos existentes

## 📋 Endpoints

### `GET /`
- **Descripción**: Ruta de prueba
- **Respuesta**: `{ "message": "API de Turnos funcionando correctamente" }`

### `POST /turno`
- **Descripción**: Crear un nuevo turno
- **Body**:
  ```json
  {
    "nombre": "Juan Pérez",
    "telefono": "1234567890",
    "fecha": "2024-01-15",
    "hora": "14:30"
  }
  ```
- **Respuesta**: `{ "id": 1, "evento": {...} }`

### `GET /turnos`
- **Descripción**: Obtener todos los turnos
- **Respuesta**: Array de turnos ordenados por fecha y hora

## 🛠️ Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd turnos-api
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar credenciales de Google**
   - Coloca tu archivo `appturnos-service-account.json` en la carpeta `credenciales/`

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Ejecutar en producción**
   ```bash
   npm start
   ```

## 🌐 Deploy

### Opción 1: Render (Recomendado)

1. **Crear cuenta en [Render](https://render.com)**
2. **Conectar tu repositorio de GitHub**
3. **Crear nuevo Web Service**
4. **Configurar**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Agregar variables si es necesario

### Opción 2: Railway

1. **Crear cuenta en [Railway](https://railway.app)**
2. **Conectar repositorio de GitHub**
3. **Deploy automático**

### Opción 3: Heroku

1. **Instalar Heroku CLI**
2. **Login y crear app**:
   ```bash
   heroku login
   heroku create tu-app-name
   ```

3. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy preparation"
   git push heroku main
   ```

## 🔧 Configuración de Google Calendar

1. **Crear proyecto en Google Cloud Console**
2. **Habilitar Google Calendar API**
3. **Crear Service Account**
4. **Descargar credenciales JSON**
5. **Compartir calendario con el email del service account**

## 📝 Variables de Entorno

Crea un archivo `.env` (opcional para desarrollo local):

```env
PORT=3000
NODE_ENV=production
```

## 🗄️ Base de Datos

La aplicación usa SQLite que se crea automáticamente. Para producción, considera migrar a PostgreSQL o MySQL.

## 📱 Uso de la API

### Ejemplo con cURL:

```bash
# Crear turno
curl -X POST https://tu-api.herokuapp.com/turno \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María García",
    "telefono": "9876543210",
    "fecha": "2024-01-20",
    "hora": "10:00"
  }'

# Obtener turnos
curl https://tu-api.herokuapp.com/turnos
```

### Ejemplo con JavaScript:

```javascript
// Crear turno
const response = await fetch('https://tu-api.herokuapp.com/turno', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nombre: 'Carlos López',
    telefono: '5551234567',
    fecha: '2024-01-25',
    hora: '16:30'
  })
});

const turno = await response.json();
console.log(turno);
```

## 🚨 Notas Importantes

- **Credenciales**: Nunca subas las credenciales de Google a GitHub
- **Base de datos**: SQLite se reinicia en cada deploy en algunas plataformas
- **CORS**: Configurado para permitir peticiones desde cualquier origen
- **Puerto**: Usa `process.env.PORT` para compatibilidad con plataformas de deploy

## 📞 Soporte

Si tienes problemas con el deploy, verifica:
1. Que todas las dependencias estén en `package.json`
2. Que el script `start` esté configurado
3. Que las credenciales de Google estén correctamente configuradas
4. Los logs del servidor para errores específicos
