@echo off
echo 🔄 Configurando tarea programada en Windows...

REM Obtener la ruta del directorio actual
set PROJECT_DIR=%CD%

REM Crear el comando
set COMMAND=cmd /c "cd /d %PROJECT_DIR% && npm run sync:check >> logs\sync.log 2>&1"

REM Crear directorio de logs
if not exist logs mkdir logs

REM Crear la tarea programada (ejecutar todos los días a las 6:00 AM)
schtasks /create /tn "PeluqueriaSync" /tr "%COMMAND%" /sc daily /st 06:00 /f

echo ✅ Tarea programada creada:
echo    - Nombre: PeluqueriaSync
echo    - Se ejecutará todos los días a las 6:00 AM
echo    - Logs se guardarán en: logs\sync.log
echo.
echo 📋 Para ver los logs: type logs\sync.log
echo 📋 Para eliminar la tarea: schtasks /delete /tn "PeluqueriaSync" /f
echo 📋 Para listar tareas: schtasks /query /tn "PeluqueriaSync"
