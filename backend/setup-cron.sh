#!/bin/bash

# Script para configurar sincronización automática con Google Calendar
# Ejecutar: chmod +x setup-cron.sh && ./setup-cron.sh

echo "🔄 Configurando sincronización automática..."

# Obtener la ruta absoluta del directorio actual
PROJECT_DIR=$(pwd)
CRON_COMMAND="cd $PROJECT_DIR && npm run sync:check >> logs/sync.log 2>&1"

# Crear directorio de logs si no existe
mkdir -p logs

# Agregar al crontab (ejecutar todos los días a las 6:00 AM)
(crontab -l 2>/dev/null; echo "0 6 * * * $CRON_COMMAND") | crontab -

echo "✅ Cron job configurado:"
echo "   - Se ejecutará todos los días a las 6:00 AM"
echo "   - Logs se guardarán en: logs/sync.log"
echo ""
echo "📋 Para ver los logs: tail -f logs/sync.log"
echo "📋 Para editar el cron: crontab -e"
echo "📋 Para listar cron jobs: crontab -l"
