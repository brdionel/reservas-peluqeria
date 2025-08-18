import React, { useState } from "react";
import { User, Phone, Scissors, Calendar, Clock, Check } from "lucide-react";
import { BookingData } from "../types/booking";

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
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar nombre (mínimo 2 palabras)
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    // Validar teléfono (formato básico)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
      newErrors.phone = "Ingresa un número de teléfono válido";
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

    const bookingData: BookingData = {
      ...formData,
      date: (() => {
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${selectedDate.getFullYear()}-${pad(
          selectedDate.getMonth() + 1
        )}-${pad(selectedDate.getDate())}`;
      })(),
      time: selectedTime,
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
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black-500 focus:border-black-500 transition-colors ${
              errors.phone ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Tu número de teléfono"
            required
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>📌 Política de reservas: </strong>
            Al reservar en <strong>Invictus</strong>, podrás cancelar o
            reprogramar hasta 2 horas antes de la cita enviando un mensaje a
            nuestro número. Tus datos
            serán utilizados únicamente para gestionar tu cita.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.phone}
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
