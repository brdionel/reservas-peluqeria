import React, { useState } from "react";
import { User, Phone, Calendar, Clock, Check } from "lucide-react";
import { BookingData, BookingStatus } from "../types/booking";
import { useBookingData } from "../hooks/useBookingData";
import { validateArgentinaPhone } from "../utils/phoneValidation";

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onBookingSubmit: (data: BookingData) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedTime,
  onBookingSubmit,
}) => {
  const { salonConfig } = useBookingData();
  const [formData, setFormData] = useState({
    name: "",
    areaCode: "",
    phoneNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    // Validar teléfono usando las reglas argentinas
    if (!formData.areaCode.trim()) {
      newErrors.areaCode = "El código de área es requerido";
    } else if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "El número es requerido";
    } else {
      const phoneValidation = validateArgentinaPhone(formData.areaCode, formData.phoneNumber);
      if (!phoneValidation.isValid) {
        // Asignar el error al campo correspondiente
        if (phoneValidation.error?.includes('Código de área')) {
          newErrors.areaCode = phoneValidation.error;
        } else {
          newErrors.phoneNumber = phoneValidation.error || "Número de teléfono inválido";
        }
      }
    }

    // Validar que la fecha esté dentro del rango permitido
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const advanceBookingDays = salonConfig?.advanceBookingDays || 30;
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + advanceBookingDays);
    
    if (selectedDate < today) {
      newErrors.date = "No se pueden hacer reservas en fechas pasadas";
    } else if (selectedDate > maxDate) {
      newErrors.date = `Solo se pueden hacer reservas hasta ${maxDate.toLocaleDateString('es-AR')} (${advanceBookingDays} días de anticipación)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simular loading
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Validar y normalizar el teléfono argentino
    const phoneValidation = validateArgentinaPhone(formData.areaCode, formData.phoneNumber);
    
    if (!phoneValidation.isValid) {
      setErrors({ phone: phoneValidation.error || 'Teléfono inválido' });
      setIsSubmitting(false);
      return;
    }
    
    const bookingData: BookingData = {
      name: formData.name,
      phone: phoneValidation.normalized,
      date: (() => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${selectedDate.getFullYear()}-${pad(
          selectedDate.getMonth() + 1
        )}-${pad(selectedDate.getDate())}`;
      })(),
      time: selectedTime,
      status: 'confirmed' as BookingStatus,
    };

    onBookingSubmit(bookingData);
    setIsSubmitting(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Confirmar Reserva
      </h3>

      <div className="bg-black-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-black-700 mb-2">
          <Calendar className="w-4 h-4" />
          <span className="font-medium capitalize">
            {formatDate(selectedDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-black-700">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{selectedTime}</span>
        </div>
        {errors.date && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {errors.date}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nombre Completo
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 transition-colors ${
              errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Tu nombre completo"
            required
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Teléfono
          </label>
          {/* Diseño responsive: horizontal en pantallas grandes, vertical en móviles */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            {/* Código de Área */}
            <div className="w-full sm:w-24 flex-shrink-0">
              <label className="block text-xs text-gray-500 mb-1">
                Código de Área
              </label>
              <div className="flex items-center">
                <div className="bg-gray-100 text-gray-600 font-medium px-2 py-3 border border-r-0 rounded-l-lg border-gray-300 text-sm flex-shrink-0">
                  0
                </div>
                <input
                  type="tel"
                  value={formData.areaCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData({ ...formData, areaCode: value });
                  }}
                  className={`w-full px-1.5 py-3 border rounded-r-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 transition-colors text-sm ${
                    errors.areaCode ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="11"
                  required
                />
              </div>
              {errors.areaCode && (
                <p className="text-red-500 text-xs mt-1">{errors.areaCode}</p>
              )}
            </div>
            
            {/* Número de Teléfono */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 mb-1">
                Número
              </label>
              <div className="flex items-center">
                <div className="bg-gray-100 text-gray-600 font-medium px-2 py-3 border border-r-0 rounded-l-lg border-gray-300 text-sm flex-shrink-0">
                  15
                </div>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({ ...formData, phoneNumber: value });
                  }}
                  className={`w-full px-3 py-3 border rounded-r-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 transition-colors text-sm ${
                    errors.phoneNumber ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="12345678"
                  required
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Ingresa el código de área sin el 0 y el número sin el 15
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>📌 Política de reservas: </strong>
            Al reservar en <strong>Invictus</strong>, podrás cancelar o
            reprogramar hasta 2 horas antes del turno enviando un mensaje a
            nuestro número. Tus datos
            serán utilizados únicamente para gestionar tu turno.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.areaCode || !formData.phoneNumber}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-black-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Confirmando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar Reserva
            </>
          )}
        </button>
      </form>
    </div>
  );
};
