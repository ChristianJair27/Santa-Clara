import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { formatDate, getAvatarName } from "../../utils";
import { FaUsers, FaClipboardList, FaChair, FaCalendarAlt, FaUser } from "react-icons/fa";

const CustomerInfo = () => {
  const [dateTime, setDateTime] = useState(new Date());

  // Datos del creador de la orden (usuario actual)
  const user = useSelector((state) => state.user?.user);

  // Datos de la “sesión de cliente/mesa” (para mesa, invitados, etc.)
  const customerData = useSelector((state) => state.customer);

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Nombre a mostrar: prioriza usuario logueado; como fallback, customerName
  const creatorName =
    user?.name ??
    user?.full_name ??
    user?.username ??
    customerData?.customerName ??
    "Usuario";

  const orderId = customerData?.orderId || "N/A";
  const guests = customerData?.guests || 1;

  // Compatibilidad con posibles claves de mesa en tu estado
  const tableNumber =
    customerData?.table?.tableNumber ??
    customerData?.table?.table_no ??
    customerData?.table?.tableId ??
    null;

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
      {/* Información del usuario que generó la orden */}
      <div className="flex-1 flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-md ring-2 ring-yellow-300">
          {getAvatarName(creatorName) || "US"}
        </div>

        <div>
          {/* Título y nombre del creador */}
          <div className="flex items-center gap-2">
            <FaUser className="text-gray-400" />
            <h1 className="text-xl font-extrabold text-white truncate max-w-[200px] sm:max-w-[250px] lg:max-w-[300px]">
              {creatorName}
            </h1>
          </div>

          {/* Detalles */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {/* ID de Orden */}
            <span className="flex items-center text-xs bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full font-medium tracking-wide">
              <FaClipboardList className="mr-1 text-gray-400" />
              Orden #{orderId}
            </span>

            {/* Número de personas */}
            <span className="flex items-center text-xs text-gray-400 font-medium">
              <FaUsers className="mr-1 text-gray-500" />
              {guests} {guests === 1 ? "persona" : "personas"}
            </span>

            {/* Fecha y Hora */}
            <span className="flex items-center text-xs text-gray-400 font-medium">
              <FaCalendarAlt className="mr-1 text-gray-500" />
              {formatDate(dateTime)}
            </span>
          </div>

          {/* Mesa (si existe) */}
          {tableNumber && (
            <div className="mt-2 flex items-center gap-2">
              <FaChair className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">
                Mesa #{tableNumber}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
