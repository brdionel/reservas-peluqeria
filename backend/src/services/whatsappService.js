import axios from 'axios';

/**
 * Servicio para enviar mensajes de WhatsApp
 * Soporta múltiples proveedores: Meta WhatsApp API, Twilio, Evolution API
 */
class WhatsAppService {
  constructor() {
    // Configuración Meta WhatsApp API
    this.metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.metaPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.metaApiVersion = 'v18.0';
    this.metaBaseUrl = `https://graph.facebook.com/${this.metaApiVersion}`;
    
    // Configuración Twilio
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM; // formato: whatsapp:+14155238886
    
    // Configuración Evolution API
    this.evolutionApiUrl = process.env.EVOLUTION_API_URL;
    this.evolutionApiKey = process.env.EVOLUTION_API_KEY;
    this.evolutionInstanceName = process.env.EVOLUTION_INSTANCE_NAME;
    
    // Proveedor activo (meta, twilio, evolution)
    this.provider = process.env.WHATSAPP_PROVIDER || 'meta';
  }

  /**
   * Envía un mensaje de WhatsApp usando el proveedor configurado
   * @param {string} to - Número de teléfono destino (formato: 5491123456789)
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendMessage(to, message) {
    try {
      const cleanNumber = this.formatPhoneNumber(to);
      
      if (!cleanNumber) {
        throw new Error('Número de teléfono inválido');
      }

      switch (this.provider.toLowerCase()) {
        case 'twilio':
          return await this.sendViaTwilio(cleanNumber, message);
        case 'evolution':
          return await this.sendViaEvolution(cleanNumber, message);
        case 'meta':
        default:
          return await this.sendViaMeta(cleanNumber, message);
      }
    } catch (error) {
      console.error('Error enviando WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  /**
   * Envía mensaje usando Meta WhatsApp API
   */
  async sendViaMeta(to, message) {
    if (!this.metaAccessToken || !this.metaPhoneNumberId) {
      return {
        success: false,
        error: 'Meta WhatsApp API no configurada'
      };
    }

    try {
      const response = await axios.post(
        `${this.metaBaseUrl}/${this.metaPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data,
        provider: 'meta'
      };
    } catch (error) {
      console.error('Error Meta WhatsApp API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        provider: 'meta'
      };
    }
  }

  /**
   * Envía mensaje usando Twilio WhatsApp API
   */
  async sendViaTwilio(to, message) {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioWhatsAppFrom) {
      return {
        success: false,
        error: 'Twilio WhatsApp API no configurada'
      };
    }

    try {
      // Formatear número para Twilio (whatsapp:+5491123456789)
      const twilioTo = `whatsapp:+${to}`;
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        new URLSearchParams({
          From: this.twilioWhatsAppFrom,
          To: twilioTo,
          Body: message
        }),
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
        data: response.data,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('Error Twilio WhatsApp API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'twilio'
      };
    }
  }

  /**
   * Envía mensaje usando Evolution API
   */
  async sendViaEvolution(to, message) {
    if (!this.evolutionApiUrl || !this.evolutionApiKey || !this.evolutionInstanceName) {
      return {
        success: false,
        error: 'Evolution API no configurada'
      };
    }

    try {
      // Formatear número para Evolution API (5491123456789@c.us)
      const evolutionTo = `${to}@c.us`;
      
      const response = await axios.post(
        `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstanceName}`,
        {
          number: evolutionTo,
          text: message
        },
        {
          headers: {
            'apikey': this.evolutionApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.key?.id || response.data.id,
        data: response.data,
        provider: 'evolution'
      };
    } catch (error) {
      console.error('Error Evolution API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'evolution'
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

Tu turno ha sido agendado:

📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${time}

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
    switch (this.provider.toLowerCase()) {
      case 'twilio':
        return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioWhatsAppFrom);
      case 'evolution':
        return !!(this.evolutionApiUrl && this.evolutionApiKey && this.evolutionInstanceName);
      case 'meta':
      default:
        return !!(this.metaAccessToken && this.metaPhoneNumberId);
    }
  }

  /**
   * Obtiene información del proveedor activo
   * @returns {Object} - Información del proveedor
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      configured: this.isConfigured(),
      name: this.getProviderName()
    };
  }

  /**
   * Obtiene el nombre del proveedor
   * @returns {string} - Nombre del proveedor
   */
  getProviderName() {
    switch (this.provider.toLowerCase()) {
      case 'twilio':
        return 'Twilio WhatsApp API';
      case 'evolution':
        return 'Evolution API';
      case 'meta':
      default:
        return 'Meta WhatsApp Business API';
    }
  }
}

export const whatsappService = new WhatsAppService();
