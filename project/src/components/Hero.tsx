import { Link } from 'react-router-dom';
import { ChevronDown, MapPin, Phone } from 'lucide-react';

interface HeroProps {
  onScrollToBooking: () => void;
}

export function Hero({ onScrollToBooking }: HeroProps) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`,
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      
      {/* Header integrado */}
      <header className="relative z-20 bg-transparent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-end">
            {/* <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Invictus</h1>
                <p className="text-white/80">Reserva tu cita online</p>
              </div>
            </div> */}
            <div className="flex items-center gap-4">
              {/* Botón para ir a admin */}
              <Link
                to="/admin/login"
                className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                title="Panel de Administración"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </Link>
              <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Chivilcoy 65 Ferre 🇦🇷</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+1 234 567 890</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Peluquería
            <span className="block text-6xl md:text-8xl bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Invictus
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto min-h-[64px]">
            {/* Experimenta el arte del cuidado capilar con nuestros profesionales expertos */}
          </p>
          
          <button
            onClick={onScrollToBooking}
            className="group inline-flex items-center gap-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Reservar Turno
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <ChevronDown className="w-6 h-6" />
      </div>
    </section>
  );
}