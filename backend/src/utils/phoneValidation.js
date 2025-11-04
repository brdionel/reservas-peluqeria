// Utilidades simples de validación de teléfono para el backend

/**
 * Valida que un teléfono sea un número argentino válido
 * Acepta múltiples formatos: +549..., 549..., 9..., 15..., 0..., 236...
 * @param {string} phone - Teléfono en cualquier formato (ej: "+549112345678", "2361212121", "0236151212121")
 * @returns {Object} Resultado de la validación
 */
export function validatePhoneFormat(phone) {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Número de teléfono requerido'
    };
  }

  // Limpiar el teléfono (solo números)
  let cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      isValid: false,
      error: 'Número de teléfono demasiado corto'
    };
  }

  // Normalizar al formato estándar (+549...)
  let normalizedPhone = '';
  
  // Si ya tiene +549 o +54 9, extraer solo números
  if (phone.includes('+549') || phone.includes('+54 9')) {
    normalizedPhone = cleanPhone;
    // Asegurar que empiece con 549
    if (!normalizedPhone.startsWith('549')) {
      // Si empieza con 54 pero no tiene el 9, agregarlo
      if (normalizedPhone.startsWith('54')) {
        normalizedPhone = '549' + normalizedPhone.substring(2);
      } else {
        normalizedPhone = '549' + normalizedPhone;
      }
    }
  }
  // Si empieza con 549 (ya normalizado)
  else if (cleanPhone.startsWith('549')) {
    normalizedPhone = cleanPhone;
  }
  // Si empieza con 54 (sin 9)
  else if (cleanPhone.startsWith('54')) {
    // Agregar el 9 después de 54
    normalizedPhone = '549' + cleanPhone.substring(2);
  }
  // Si empieza con 9 (solo el 9 móvil)
  else if (cleanPhone.startsWith('9')) {
    normalizedPhone = '54' + cleanPhone;
  }
  // Si empieza con 15 (15 seguido del código de área, ej: 152361212121)
  else if (cleanPhone.startsWith('15')) {
    // El 15 es parte del prefijo móvil, eliminarlo y agregar 549
    normalizedPhone = '549' + cleanPhone.substring(2);
  }
  // Si empieza con 0 (0 seguido del código de área, ej: 0236151212121)
  else if (cleanPhone.startsWith('0')) {
    // Remover el 0 inicial
    const withoutZero = cleanPhone.substring(1);
    // Si después del 0 empieza con 15, remover también el 15
    if (withoutZero.startsWith('15')) {
      normalizedPhone = '549' + withoutZero.substring(2);
    } else {
      // Solo remover el 0 y agregar 549
      normalizedPhone = '549' + withoutZero;
    }
  }
  // Para otros casos (código de área directamente, ej: 2361212121 o 236151212121)
  else {
    // Verificar si el número tiene el prefijo 15 después del código de área
    // Códigos de área pueden ser de 2 dígitos (11) o 3 dígitos (236, 220)
    // Intentar primero con 3 dígitos
    const possibleArea3 = cleanPhone.substring(0, 3);
    const rest3 = cleanPhone.substring(3);
    
    // Si después del posible código de área de 3 dígitos empieza con 15, removerlo
    if (rest3.startsWith('15')) {
      normalizedPhone = '549' + possibleArea3 + rest3.substring(2);
    } 
    // Intentar con 2 dígitos
    else {
      const possibleArea2 = cleanPhone.substring(0, 2);
      const rest2 = cleanPhone.substring(2);
      
      // Si después del posible código de área de 2 dígitos empieza con 15, removerlo
      if (rest2.startsWith('15')) {
        normalizedPhone = '549' + possibleArea2 + rest2.substring(2);
      } else {
        // Sin prefijo 15, agregar 549 directamente
        normalizedPhone = '549' + cleanPhone;
      }
    }
  }

  // Verificar longitud después de normalización
  // Formato esperado: 549 + código de área (2-3 dígitos) + número (7-8 dígitos)
  // Total: mínimo 11 dígitos (549 + 2 + 7 = 12) hasta máximo 14 dígitos (549 + 3 + 8 = 14)
  if (normalizedPhone.length < 12 || normalizedPhone.length > 14) {
    return {
      isValid: false,
      error: `Longitud de teléfono inválida después de normalizar: ${normalizedPhone.length} dígitos. Esperado: 12-14 dígitos.`
    };
  }

  // Verificar que después de 549 tenga un formato razonable
  const after549 = normalizedPhone.substring(3);
  
  // Código de área puede ser 2 dígitos (11) o 3 dígitos (236, 220, etc.)
  // Después del código de área deben quedar 7 u 8 dígitos
  const areaCodeLength = after549.length === 9 || after549.length === 10 ? 2 : 3;
  const numberLength = after549.length - areaCodeLength;
  
  if (numberLength < 7 || numberLength > 8) {
    return {
      isValid: false,
      error: `Número inválido después del código de área. Longitud del número: ${numberLength} dígitos (esperado: 7-8)`
    };
  }
  
  return {
    isValid: true,
    normalized: `+${normalizedPhone}`
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
