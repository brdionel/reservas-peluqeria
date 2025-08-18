@echo off
echo 🔄 Configurando tarea programada cada 15 minutos...

REM Obtener la ruta del directorio actual
set PROJECT_DIR=%CD%

REM Crear el comando
set COMMAND=cmd /c "cd /d %PROJECT_DIR% && npm run sync:check >> logs\sync-15min.log 2>&1"

REM Crear directorio de logs
if not exist logs mkdir logs

REM Crear la tarea programada (cada 15 minutos, de 6 AM a 8 PM)
schtasks /create /tn "PeluqueriaSync15min" /tr "%COMMAND%" /sc minute /mo 15 /st 06:00 /et 20:00 /f

echo ✅ Tarea programada creada:
echo    - Nombre: PeluqueriaSync15min
echo    - Se ejecutará cada 15 minutos
echo    - Horario: 6:00 AM a 8:00 PM
echo    - Logs se guardarán en: logs\sync-15min.log
echo.
echo 📋 Para ver los logs: type logs\sync-15min.log
echo 📋 Para eliminar la tarea: schtasks /delete /tn "PeluqueriaSync15min" /f
echo 📋 Para listar tareas: schtasks /query /tn "PeluqueriaSync15min"
echo.
echo 💡 Consideraciones:
echo    - Se ejecutará 56 veces por día (cada 15 min x 14 horas)
echo    - Consumo de API: ~168 requests/día (muy por debajo del límite gratuito)
echo    - Costo de servidor: insignificante
