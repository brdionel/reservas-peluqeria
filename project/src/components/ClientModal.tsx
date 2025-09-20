import React, { useState, useEffect } from "react";
import { X, User } from "lucide-react";

interface Client {
  name: string;
  phone: string;
  totalBookings?: number;
  lastVisit?: string;
  firstVisit?: string;
  isRegular?: boolean;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: { name: string; areaCode: string; phoneNumber: string }) => void;
  client?: Client | null;
  mode: "add" | "edit";
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  client,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    areaCode: "",
    phoneNumber: "",
  });

  // Cargar datos del cliente cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && client && mode === "edit") {
      // Extraer código de área y número del teléfono completo
      const phone = client.phone.replace("+54 9 ", "");
      const parts = phone.split(" ");
      if (parts.length >= 2) {
        setFormData({
          name: client.name,
          areaCode: parts[0],
          phoneNumber: parts[1],
        });
      } else {
        setFormData({
          name: client.name,
          areaCode: "",
          phoneNumber: "",
        });
      }
    } else if (isOpen && mode === "add") {
      setFormData({
        name: "",
        areaCode: "",
        phoneNumber: "",
      });
    }
  }, [isOpen, client, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.areaCode || !formData.phoneNumber) {
      return;
    }

    await onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({ name: "", areaCode: "", phoneNumber: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {mode === "add" ? "Agregar Cliente" : "Editar Cliente"}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === "add" 
                  ? "Ingresa los datos del nuevo cliente" 
                  : "Modifica la información del cliente"
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              placeholder="Ingresa el nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono *
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="bg-gray-100 text-gray-600 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg">
                  0
                </span>
                <input
                  type="text"
                  placeholder="11"
                  value={formData.areaCode}
                  onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                  className="w-24 px-3 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="flex items-center">
                <span className="bg-gray-100 text-gray-600 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg">
                  15
                </span>
                <input
                  type="text"
                  placeholder="1234-5678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Información adicional para modo edición */}
          {mode === "edit" && client && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-800">Información del Cliente</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total visitas:</span>
                  <span className="font-medium">{client.totalBookings || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última visita:</span>
                  <span className="font-medium">{client.lastVisit || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Primera visita:</span>
                  <span className="font-medium">{client.firstVisit || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {mode === "add" ? "Agregar Cliente" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
