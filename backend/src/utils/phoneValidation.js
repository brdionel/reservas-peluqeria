// Utilidades simples de validación de teléfono para el backend

/**
 * Valida que un teléfono sea un número argentino válido
 * @param {string} phone - Teléfono completo (ej: "+541112345678")
 * @returns {Object} Resultado de la validación
 */
export function validatePhoneFormat(phone) {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Número de teléfono requerido'
    };
  }

  // Limpiar el teléfono
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verificar que empiece con 549 (Argentina móvil)
  if (!cleanPhone.startsWith('549')) {
    return {
      isValid: false,
      error: 'Debe ser un número de teléfono móvil argentino (formato +549)'
    };
  }
  
  // Verificar longitud mínima (549 + código de área + número)
  if (cleanPhone.length < 11 || cleanPhone.length > 14) {
    return {
      isValid: false,
      error: 'Longitud de teléfono inválida'
    };
  }
  
  return {
    isValid: true,
    normalized: `+${cleanPhone}`
  };
}

/**
 * Normaliza un teléfono para almacenamiento
 * @param {string} phone - Teléfono en cualquier formato
 * @returns {string} Teléfono normalizado con +
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Si no empieza con 549, agregarlo
  if (!cleanPhone.startsWith('549')) {
    return `+549${cleanPhone}`;
  }
  
  return `+${cleanPhone}`;
}
