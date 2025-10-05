// Validación y normalización de números de teléfono argentinos

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  error?: string;
  areaCode?: string;
  number?: string;
}

// Códigos de área de Argentina con sus longitudes válidas
export const ARGENTINA_AREA_CODES = {
  // Buenos Aires (CABA y GBA)
  '11': { length: 8, name: 'Buenos Aires (CABA y GBA)', format: '####-####' },
  '220': { length: 7, name: 'Merlo', format: '###-####' },
  '221': { length: 7, name: 'La Plata', format: '###-####' },
  '222': { length: 7, name: 'Luján', format: '###-####' },
  '223': { length: 7, name: 'Mar del Plata', format: '###-####' },
  '224': { length: 7, name: 'Tandil', format: '###-####' },
  '225': { length: 7, name: 'Dolores', format: '###-####' },
  '226': { length: 7, name: 'Olavarría', format: '###-####' },
  '227': { length: 7, name: 'Azul', format: '###-####' },
  '228': { length: 7, name: 'Tres Arroyos', format: '###-####' },
  '229': { length: 7, name: 'Necochea', format: '###-####' },
  '230': { length: 7, name: 'General Pueyrredón', format: '###-####' },
  '231': { length: 7, name: 'San Antonio de Areco', format: '###-####' },
  '232': { length: 7, name: 'Chivilcoy', format: '###-####' },
  '234': { length: 7, name: 'Salto', format: '###-####' },
  '235': { length: 7, name: 'General Villegas', format: '###-####' },
  '236': { length: 7, name: 'Pergamino', format: '###-####' },
  '237': { length: 7, name: 'San Pedro', format: '###-####' },
  '239': { length: 7, name: 'General Rodríguez', format: '###-####' },
  
  // Córdoba
  '351': { length: 7, name: 'Córdoba Capital', format: '###-####' },
  '352': { length: 7, name: 'Río Cuarto', format: '###-####' },
  '353': { length: 7, name: 'Villa María', format: '###-####' },
  '354': { length: 7, name: 'San Francisco', format: '###-####' },
  '356': { length: 7, name: 'Marcos Juárez', format: '###-####' },
  '357': { length: 7, name: 'Villa Dolores', format: '###-####' },
  
  // Santa Fe
  '341': { length: 7, name: 'Rosario', format: '###-####' },
  '342': { length: 7, name: 'Santa Fe Capital', format: '###-####' },
  '344': { length: 7, name: 'Reconquista', format: '###-####' },
  '345': { length: 7, name: 'Rafaela', format: '###-####' },
  '346': { length: 7, name: 'Venado Tuerto', format: '###-####' },
  '347': { length: 7, name: 'San Jorge', format: '###-####' },
  '348': { length: 7, name: 'San Cristóbal', format: '###-####' },
  '349': { length: 7, name: 'Sunchales', format: '###-####' },
  
  // Mendoza
  '261': { length: 7, name: 'Mendoza Capital', format: '###-####' },
  '262': { length: 7, name: 'San Rafael', format: '###-####' },
  '263': { length: 7, name: 'Malargüe', format: '###-####' },
  
  // Tucumán
  '381': { length: 7, name: 'San Miguel de Tucumán', format: '###-####' },
  
  // Salta
  '387': { length: 7, name: 'Salta Capital', format: '###-####' },
  
  // Jujuy
  '388': { length: 7, name: 'San Salvador de Jujuy', format: '###-####' },
  
  // Entre Ríos
  '343': { length: 7, name: 'Paraná', format: '###-####' },
  
  // Corrientes
  '378': { length: 7, name: 'Corrientes Capital', format: '###-####' },
  
  // Misiones
  '375': { length: 7, name: 'Posadas', format: '###-####' },
  
  // Chaco
  '372': { length: 7, name: 'Resistencia', format: '###-####' },
  
  // Formosa
  '371': { length: 7, name: 'Formosa Capital', format: '###-####' },
  
  // Santiago del Estero
  '385': { length: 7, name: 'Santiago del Estero', format: '###-####' },
  
  // Catamarca
  '383': { length: 7, name: 'San Fernando del Valle de Catamarca', format: '###-####' },
  
  // La Rioja
  '382': { length: 7, name: 'La Rioja Capital', format: '###-####' },
  
  // San Juan
  '264': { length: 7, name: 'San Juan Capital', format: '###-####' },
  
  // San Luis
  '266': { length: 7, name: 'San Luis Capital', format: '###-####' },
  
  // Neuquén
  '299': { length: 7, name: 'Neuquén Capital', format: '###-####' },
  
  // Río Negro
  '292': { length: 7, name: 'Viedma', format: '###-####' },
  '294': { length: 7, name: 'San Carlos de Bariloche', format: '###-####' },
  
  // Chubut
  '296': { length: 7, name: 'Rawson', format: '###-####' },
  '297': { length: 7, name: 'Comodoro Rivadavia', format: '###-####' },
  
  // Santa Cruz
  '298': { length: 7, name: 'Río Gallegos', format: '###-####' },
  
  // Tierra del Fuego
  '290': { length: 7, name: 'Ushuaia', format: '###-####' }
};

/**
 * Valida y normaliza un número de teléfono argentino
 */
export function validateArgentinaPhone(areaCode: string, phoneNumber: string): PhoneValidationResult {
  // Limpiar inputs
  const cleanAreaCode = areaCode.replace(/\D/g, '');
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
  
  // Validar que no estén vacíos
  if (!cleanAreaCode || !cleanPhoneNumber) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: 'Código de área y número son requeridos'
    };
  }
  
  // Buscar el código de área
  const areaInfo = ARGENTINA_AREA_CODES[cleanAreaCode as keyof typeof ARGENTINA_AREA_CODES];
  
  if (!areaInfo) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: `Código de área ${cleanAreaCode} no válido`
    };
  }
  
  // Validar longitud del número
  if (cleanPhoneNumber.length !== areaInfo.length) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: `El número debe tener ${areaInfo.length} dígitos para este código de área`
    };
  }
  
  // Crear número normalizado con 9 para móviles argentinos
  const normalized = `+549${cleanAreaCode}${cleanPhoneNumber}`;
  
  // Crear número formateado
  const formatted = formatPhoneNumber(cleanAreaCode, cleanPhoneNumber, areaInfo.format);
  
  return {
    isValid: true,
    normalized,
    formatted,
    areaCode: cleanAreaCode,
    number: cleanPhoneNumber
  };
}

/**
 * Formatea un número de teléfono según el patrón especificado
 */
function formatPhoneNumber(areaCode: string, number: string, format: string): string {
  let formatted = format;
  let numberIndex = 0;
  
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] === '#') {
      formatted = formatted.substring(0, i) + number[numberIndex] + formatted.substring(i + 1);
      numberIndex++;
    }
  }
  
  return `+54 ${areaCode} ${formatted}`;
}

/**
 * Obtiene información del código de área
 */
export function getAreaCodeInfo(areaCode: string) {
  const cleanAreaCode = areaCode.replace(/\D/g, '');
  return ARGENTINA_AREA_CODES[cleanAreaCode as keyof typeof ARGENTINA_AREA_CODES];
}

/**
 * Obtiene todos los códigos de área disponibles
 */
export function getAllAreaCodes() {
  return Object.keys(ARGENTINA_AREA_CODES).sort();
}

/**
 * Formatea un número normalizado para mostrar al usuario (sin +549)
 * @param normalizedPhone - Número normalizado (ej: +549112345678)
 * @returns Número formateado para mostrar (ej: 11 1234-5678)
 */
export function formatPhoneForDisplay(normalizedPhone: string): string {
  if (!normalizedPhone) return '';
  
  // Remover +549 del inicio
  const cleanPhone = normalizedPhone.replace(/^\+549/, '');
  
  if (cleanPhone.length < 2) return normalizedPhone;
  
  // Separar código de área y número
  const areaCode = cleanPhone.slice(0, 2);
  const number = cleanPhone.slice(2);
  
  // Fallback: mostrar como está
  return `${areaCode} ${number}`;
}
