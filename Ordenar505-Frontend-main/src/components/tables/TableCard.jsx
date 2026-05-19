import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaChair, FaUserAlt } from "react-icons/fa";
import { GiRoundTable } from "react-icons/gi";

const TableCard = ({ id, name, status, customerName, seats }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClick = (name) => {
    if (status === "Ocupado") return;

    const table = { tableId: id, tableNo: name };
    dispatch(updateTable({ table }));
    navigate(`/menu`);
  };

  // Estilos basados en estado
  const statusStyles = {
    Ocupado: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: "🟢",
    },
    Disponible: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      icon: "🔵",
    },
    Occupied: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      icon: "🟠",
    },
    Dirty: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: "🔴",
    },
  };

  const currentStatus = statusStyles[status] || statusStyles.Disponible;

  return (
    <div
      onClick={() => handleClick(name)}
      className={`w-full max-w-xs rounded-xl overflow-hidden shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl ${
        status === "Ocupado" ? "cursor-not-allowed opacity-90" : "cursor-pointer"
      }`}
    >
      {/* Header con número de mesa */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <GiRoundTable className="text-2xl mr-2" />
            <h2 className="text-xl font-bold">Mesa {name}</h2>
          </div>
          <span
            className={`${currentStatus.bg} ${currentStatus.text} text-xs font-semibold px-2 py-1 rounded-full`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white p-5">
        <div className="flex flex-col items-center mb-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2 ${
              customerName ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            {customerName ? customerName[0]?.toUpperCase() : <FaUserAlt className="text-gray-400" />}
          </div>
          <p className="text-sm text-gray-600">
            {status === "Ocupado"
              ? `Reservado a: ${customerName ?? "N/A"}`
              : "Disponible"}
          </p>
        </div>

        {/* Detalles de la mesa */}
        <div className="grid grid-cols-2 gap-4 text-center">
          {status === "Ocupado" ? (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-center items-center text-green-600 mb-1">
                <FaUserAlt className="mr-1" />
                <span className="font-medium">Mesero</span>
              </div>
              <span className="text-lg font-bold">{customerName ?? "N/A"}</span>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-center items-center text-blue-600 mb-1">
                <FaChair className="mr-1" />
                <span className="font-medium">Asientos</span>
              </div>
              <span className="text-lg font-bold">{seats}</span>
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-center items-center text-blue-600 mb-1">
              <span className="font-medium">Estado</span>
            </div>
            <span className={`text-sm font-semibold ${currentStatus.text}`}>
              {currentStatus.icon} {status}
            </span>
          </div>
        </div>
      </div>

      {/* Footer con acción */}
      <div
        className={`px-4 py-3 ${
          status === "Ocupado" ? "bg-gray-100" : "bg-blue-50"
        }`}
      >
        <button
          disabled={status === "Ocupado"}
          className={`w-full py-2 rounded-md font-medium text-sm ${
            status === "Ocupado"
              ? "text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {status === "Ocupado" ? "Mesa reservada" : "Tomar pedido"}
        </button>
      </div>
    </div>
  );
};

export default TableCard;
