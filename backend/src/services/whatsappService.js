import axios from 'axios';

/**
 * Servicio para enviar mensajes de WhatsApp usando WhatsApp Cloud API
 */
class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Envía un mensaje de WhatsApp
   * @param {string} to - Número de teléfono destino (formato: 5491123456789)
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendMessage(to, message) {
    try {
      // Limpiar y formatear el número de teléfono
      const cleanNumber = this.formatPhoneNumber(to);
      
      if (!cleanNumber) {
        throw new Error('Número de teléfono inválido');
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: cleanNumber,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };
    } catch (error) {
      console.error('Error enviando WhatsApp:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Envía confirmación de turno
   * @param {Object} booking - Datos del turno
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendBookingConfirmation(booking) {
    const { client, date, time, service } = booking;
    
    // Formatear fecha
    const bookingDate = new Date(date + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });

    const message = `🎉 *¡Turno Confirmado!*

Hola ${client.name}! 👋

Tu turno ha sido agendado exitosamente:

📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${time}
💇‍♀️ *Servicio:* ${service || 'Corte y peinado'}

¡Te esperamos en el salón! 

Si necesitas cambiar o cancelar tu turno, contáctanos.

Saludos,
Salón Invictus ✨`;

    return await this.sendMessage(client.phone, message);
  }

  /**
   * Envía recordatorio de turno
   * @param {Object} booking - Datos del turno
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendBookingReminder(booking) {
    const { client, date, time, service } = booking;
    
    const bookingDate = new Date(date + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });

    const message = `⏰ *Recordatorio de Turno*

Hola ${client.name}! 👋

Te recordamos que tienes un turno mañana:

📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${time}
💇‍♀️ *Servicio:* ${service || 'Corte y peinado'}

¡Te esperamos! 

Saludos,
Salón Invictus ✨`;

    return await this.sendMessage(client.phone, message);
  }

  /**
   * Formatea el número de teléfono para WhatsApp
   * @param {string} phone - Número de teléfono
   * @returns {string} - Número formateado
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remover todos los caracteres no numéricos
    const cleanNumber = phone.replace(/\D/g, '');
    
    // Si empieza con 54, usar tal como está
    if (cleanNumber.startsWith('54')) {
      return cleanNumber;
    }
    
    // Si empieza con 9, agregar 54
    if (cleanNumber.startsWith('9')) {
      return '54' + cleanNumber;
    }
    
    // Si empieza con 11, agregar 549
    if (cleanNumber.startsWith('11')) {
      return '549' + cleanNumber;
    }
    
    // Si es un número local argentino, agregar 549
    if (cleanNumber.length >= 8 && cleanNumber.length <= 10) {
      return '549' + cleanNumber;
    }
    
    return null;
  }

  /**
   * Verifica si el servicio está configurado
   * @returns {boolean} - True si está configurado
   */
  isConfigured() {
    return !!(this.accessToken && this.phoneNumberId);
  }
}

export const whatsappService = new WhatsAppService();

