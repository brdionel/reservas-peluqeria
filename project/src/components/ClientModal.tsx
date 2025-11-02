import React, { useState, useEffect } from "react";
import { X, User } from "lucide-react";

interface Client {
  id?: number;
  name: string;
  phone: string;
  totalBookings?: number;
  lastVisit?: string;
  firstVisit?: string;
  isRegular?: boolean;
  source?: string;
  isVerified?: boolean;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: {
    name: string;
    areaCode: string;
    phoneNumber: string;
    isVerified?: boolean;
  }) => void;
  client?: Client | null;
  mode: "add" | "edit";
  isLoading?: boolean;
  clientRequiresAttention?: (client: Client) => boolean;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  client,
  mode,
  isLoading = false,
  clientRequiresAttention,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    areaCode: "",
    phoneNumber: "",
    phoneFull: "", // Para modo edición con input único
    isVerified: false,
  });

  // Determinar si el cliente requiere atención
  const requiresAttention =
    mode === "edit" && client && clientRequiresAttention
      ? clientRequiresAttention(client)
      : false;

  // Cargar datos del cliente cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && client && mode === "edit") {
      // En modo edición, mostrar el teléfono completo en un solo campo
      // Limpiar el formato para mostrar: remover +, espacios, guiones
      const phoneDisplay = client.phone
        .replace(/\+/g, "")
        .replace(/\s/g, "")
        .replace(/-/g, "");

      setFormData({
        name: client.name,
        areaCode: "",
        phoneNumber: "",
        phoneFull: phoneDisplay,
        isVerified: client.isVerified || false,
      });
    } else if (isOpen && mode === "add") {
      setFormData({
        name: "",
        areaCode: "",
        phoneNumber: "",
        phoneFull: "",
        isVerified: false,
      });
    }
  }, [isOpen, client, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación según el modo
    if (mode === "edit") {
      if (!formData.name || !formData.phoneFull) {
        return;
      }
      // En modo edición, parsear el teléfono completo correctamente
      let phoneClean = formData.phoneFull.replace(/\D/g, ""); // Solo números

      // Si el teléfono ya tiene el prefijo 549, removerlo primero
      if (phoneClean.startsWith("549")) {
        phoneClean = phoneClean.substring(3); // Remover "549"
      }

      // Ahora dividir en área (primeros 2 dígitos) y número (resto)
      const areaCode = phoneClean.substring(0, 2);
      const phoneNumber = phoneClean.substring(2);

      const submitData: {
        name: string;
        areaCode: string;
        phoneNumber: string;
        isVerified?: boolean;
      } = {
        name: formData.name,
        areaCode: areaCode,
        phoneNumber: phoneNumber,
      };

      if (requiresAttention) {
        submitData.isVerified = formData.isVerified;
      }

      await onSubmit(submitData);
    } else {
      // Modo agregar: validar campos separados
      if (!formData.name || !formData.areaCode || !formData.phoneNumber) {
        return;
      }

      const submitData: {
        name: string;
        areaCode: string;
        phoneNumber: string;
        isVerified?: boolean;
      } = {
        name: formData.name,
        areaCode: formData.areaCode,
        phoneNumber: formData.phoneNumber,
      };

      await onSubmit(submitData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      areaCode: "",
      phoneNumber: "",
      phoneFull: "",
      isVerified: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
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
                  : "Modifica la información del cliente"}
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

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Warning si requiere atención */}
            {mode === "edit" && requiresAttention && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                    ⚠️ REQUIERE ATENCIÓN
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  Este cliente requiere verificación de contacto. Marca la
                  casilla abajo para verificar.
                </p>
              </div>
            )}

            {/* Checkbox de verificación - solo si requiere atención */}
            {mode === "edit" && requiresAttention && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) =>
                      setFormData({ ...formData, isVerified: e.target.checked })
                    }
                    disabled={isLoading}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      Verificar contacto del cliente
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Marca esta casilla para confirmar que el contacto está
                      verificado
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                placeholder="Ingresa el nombre completo"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  isLoading
                    ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
                required
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono *
              </label>
              {mode === "edit" ? (
                // Modo edición: input único
                <input
                  type="text"
                  placeholder="5491112345678"
                  value={formData.phoneFull}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneFull: e.target.value })
                  }
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                    isLoading
                      ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  required
                />
              ) : (
                // Modo agregar: inputs separados
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-600 px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg">
                      0
                    </span>
                    <input
                      type="text"
                      placeholder="11"
                      value={formData.areaCode}
                      onChange={(e) =>
                        setFormData({ ...formData, areaCode: e.target.value })
                      }
                      disabled={isLoading}
                      className={`w-24 px-3 py-3 border rounded-r-lg transition-colors ${
                        isLoading
                          ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className={`flex-1 px-3 py-3 border rounded-r-lg transition-colors ${
                        isLoading
                          ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Información adicional para modo edición */}
            {mode === "edit" && client && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-800">
                  Información del Cliente
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Total visitas:</span>
                    <span className="font-medium">
                      {client.totalBookings || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última visita:</span>
                    <span className="font-medium">
                      {client.lastVisit || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primera visita:</span>
                    <span className="font-medium">
                      {client.firstVisit || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones - Fixed */}
          <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 border rounded-lg transition-colors ${
                isLoading
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isLoading
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === "add" ? "Agregando..." : "Guardando..."}
                </>
              ) : mode === "add" ? (
                "Agregar Cliente"
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
