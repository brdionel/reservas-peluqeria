import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBookingData } from "../hooks/useBookingData";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange,
}) => {
  const { hasAvailability, salonConfig } = useBookingData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const goToPreviousMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    onMonthChange(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    onMonthChange(newMonth);
  };

  const isDateSelectable = (date: Date) => {
    // Verificar que la fecha no sea pasada
    if (date < today) {
      return false;
    }
    
    // Verificar que la fecha esté dentro del rango permitido
    const advanceBookingDays = salonConfig?.advanceBookingDays || 30;
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + advanceBookingDays);
    
    if (date > maxDate) {
      return false;
    }
    
    // Verificar disponibilidad
    return hasAvailability(date);
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = today.toDateString() === date.toDateString();
      const isSelectable = isDateSelectable(date);
      const hasSlots = hasAvailability(date);
      const isPastDate = date < today;
      const advanceBookingDays = salonConfig?.advanceBookingDays || 30;
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + advanceBookingDays);
      const isBeyondRange = date > maxDate;

      days.push(
        <button
          key={day}
          onClick={() => isSelectable && onDateSelect(date)}
          disabled={!isSelectable}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
            ${
              isSelected
                ? "bg-blue-500 text-white shadow-lg scale-105"
                : isToday
                ? "bg-blue-100 text-blue-600 border-2 border-blue-300"
                : isSelectable
                ? hasSlots
                  ? "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300"
                  : "bg-orange-50 text-orange-600 border border-orange-200"
                : isPastDate
                ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                : isBeyondRange
                ? "bg-yellow-50 text-yellow-500 cursor-not-allowed"
                : "bg-red-50 text-red-400 cursor-not-allowed"
            }
            ${isSelectable ? "hover:shadow-md" : ""}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

      <div className="mt-4 space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Fecha seleccionada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
          <span>Completo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-50 rounded"></div>
          <span>Pasado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-50 rounded"></div>
          <span>Fuera del rango ({salonConfig?.advanceBookingDays || 30} días)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-50 rounded"></div>
          <span>Cerrado</span>
        </div>
      </div>
    </div>
  );
};
