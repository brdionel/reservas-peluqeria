import React from 'react';
import { Clock, User } from 'lucide-react';
import { TimeSlot } from '../types/booking';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  selectedDate: Date;
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({
  slots,
  selectedTime,
  onTimeSelect,
  selectedDate,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-black-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Horarios Disponibles
        </h3>
      </div>
      
      <p className="text-gray-600 mb-4 capitalize">
        {formatDate(selectedDate)}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            disabled={!slot.available}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
              ${selectedTime === slot.time
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : slot.available
                ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <div className="flex items-center justify-center gap-1">
              {!slot.available && <User className="w-3 h-3" />}
              <span>{slot.time}</span>
            </div>
            {!slot.available && (
              <div className="text-xs text-gray-400 mt-1">
                Ocupado
              </div>
            )}
          </button>
        ))}
      </div>

      {slots.filter(slot => slot.available).length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay horarios disponibles para este día</p>
        </div>
      )}
    </div>
  );
};