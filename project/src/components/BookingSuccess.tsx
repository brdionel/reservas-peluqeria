import React from 'react';
import { CheckCircle, Calendar, Clock, User, Phone } from 'lucide-react';
import { BookingData } from '../types/booking';
import { formatPhoneForDisplay } from '../utils/phoneValidation';

interface BookingSuccessProps {
  booking: BookingData;
  onNewBooking: () => void;
  onClose?: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  booking,
  onNewBooking,
  onClose,
}) => {

  function formatDate(dateString: string) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
  }

  const handleNewBooking = () => {
    onNewBooking();
    onClose?.();
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        ¡Reserva Confirmada!
      </h2>
      
      <p className="text-gray-600 mb-8">
        Tu turno ha sido agendado. Te esperamos!
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
        <h3 className="font-semibold text-gray-800 mb-4">Detalles de tu turno:</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{booking.client?.name || booking.name}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">
              {formatPhoneForDisplay(booking.client?.phone || booking.phone)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 capitalize">{formatDate(booking.date)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{booking.time}</span>
          </div>
        
        </div>
      </div>

      <div className="bg-black-50 rounded-lg p-4 mb-6">
        <p className="text-black text-sm">
          <strong>Recordatorio:</strong> Por favor llega 5 minutos antes de tu turno. 
          Si necesitas cancelar o reprogramar, contáctanos con al menos 2 horas de anticipación.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        {onClose && (
          <button
            onClick={handleNewBooking}
            className="bg-black text-white py-3 px-8 rounded-lg font-medium  hover:bg-gray-800 transition-colors"
          >
            Listo
          </button>
        )}
      </div>
    </div>
  );
};