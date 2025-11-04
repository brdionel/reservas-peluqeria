import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { Calendar } from './components/Calendar';
import { TimeSlots } from './components/TimeSlots';
import { BookingForm } from './components/BookingForm';
import { BookingSuccess } from './components/BookingSuccess';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { Hero } from './components/Hero';
import { Modal } from './components/Modal';
import { useBookingData } from './hooks/useBookingData';
import { useAuth } from './hooks/useAuth';
import { BookingData } from './types/booking';

function ReservaView() {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = React.useState<string>('');
  const [completedBooking, setCompletedBooking] = React.useState<BookingData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const { getAvailableSlots, createBooking, isLoaded } = useBookingData();
  const availableSlots = getAvailableSlots(selectedDate);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleBookingSubmit = async (bookingData: BookingData) => {
    const success = await createBooking(bookingData);
    if (success) {
      setCompletedBooking(bookingData);
      setShowSuccessModal(true);
    } else {
      // Lanzar error para que BookingForm pueda manejarlo
      throw new Error('Error al crear la reserva. Por favor, intenta nuevamente.');
    }
  };

  const handleNewBooking = () => {
    setCompletedBooking(null);
    setShowSuccessModal(false);
    setSelectedTime('');
    setSelectedDate(new Date());
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black-50 via-white to-black-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Agenda tu Turno
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selecciona la fecha y horario que mejor te convenga.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </div>
          {/* Time Slots */}
          <div className="lg:col-span-1">
            <TimeSlots
              slots={availableSlots}
              selectedTime={selectedTime}
              onTimeSelect={setSelectedTime}
              selectedDate={selectedDate}
            />
          </div>
          {/* Booking Form */}
          <div className="lg:col-span-1">
            {selectedTime ? (
              <BookingForm
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onBookingSubmit={handleBookingSubmit}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Información del Salón
                </h3>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Horarios de Atención:</h4>
                    <p className="text-sm">Martes a Viernes: 9:30 AM - 8:00 PM</p>
                    <p className="text-sm">Sábados: 10:00 AM - 7:00 PM</p>
                    <p className="text-sm">Domingo y Lunes: Cerrado</p>
                  </div>
                  <div className="bg-black-50 rounded-lg p-3">
                    <p className="text-black text-sm">
                      <strong>Paso 1:</strong> Selecciona una fecha en el calendario<br />
                      <strong>Paso 2:</strong> Elige un horario disponible<br />
                      <strong>Paso 3:</strong> Completa tus datos
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de éxito */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={handleNewBooking}
        title="Reserva Confirmada"
        type="success"
      >
        {completedBooking && (
          <BookingSuccess 
            booking={completedBooking} 
            onNewBooking={handleNewBooking}
            onClose={handleCloseModal}
          />
        )}
      </Modal>
    </main>
  );
}

// Componente para proteger rutas de admin
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

// Componente para la página de login de admin
function AdminLoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, redirigir al panel
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleLoginSuccess = () => {
    // La redirección se maneja automáticamente
  };

  return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClientView />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminPanel onBackToClient={() => window.location.href = '/'} />
            </ProtectedAdminRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

function ClientView() {
  const reservaViewRef = React.useRef<HTMLDivElement>(null);

  const scrollToReserva = () => {
    reservaViewRef.current?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="bg-gradient-to-br from-black-50 via-white to-black-50">
      {/* Hero Section con Header Integrado */}
      <Hero onScrollToBooking={scrollToReserva} />
      
      {/* Reserva Section */}
      <div ref={reservaViewRef} className="min-h-screen">
        <ReservaView />
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scissors className="w-5 h-5" />
            <span className="font-semibold">Peluquería Invictus</span>
          </div>
          <p className="text-gray-300 text-sm">
            © 2025 Peluquería Invictus.
          </p>
        </div>
      </footer>
    </div>
  );
}
export default App;