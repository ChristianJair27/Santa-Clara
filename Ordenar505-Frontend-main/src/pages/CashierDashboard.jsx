import { useEffect, useState } from "react";
import axios from "axios";
import { axiosWrapper } from "../https/axiosWrapper";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getCashMovements, updateOrderStatus } from "../https/index";
import { formatDateAndTime } from "../utils";
import { useSelector } from "react-redux";
import CorteTicket from "../components/corte/CorteTicket";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const CashierDashboard = () => {
  const [totalCash, setTotalCash] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("ingreso");
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cash");
  const [cashMovements, setCashMovements] = useState([]);
  const user = useSelector((state) => state.user.user);
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  
const [corteInfo, setCorteInfo] = useState(null);
const [showCorteModal, setShowCorteModal] = useState(false);
const corteRef = useRef();
const printCorte = useReactToPrint({
  content: () => corteRef.current || null,
  documentTitle: `Corte_Turno_${turnoSeleccionado}`,
  onAfterPrint: () =>
    enqueueSnackbar("Corte impreso correctamente", { variant: "success" }),
});

const handlePrintClick = () => {
  console.log("Ref actual:", corteRef.current);
  if (!corteRef.current) {
    enqueueSnackbar("El ticket aún no está listo para imprimir", { variant: "error" });
    return;
  }
  printCorte();
};



const handleCorte = async () => {
  if (!turnoSeleccionado) {
    enqueueSnackbar("Selecciona un turno válido", { variant: "error" });
    return;
  }

  try {
    // 1. Obtener el resumen del turno usando la ruta correcta
    const corteRes = await axiosWrapper.get(
      `${API_URL}/api/shifts/${turnoSeleccionado}/corte`
    );
    const corteData = corteRes.data;

    // 2. Obtener los movimientos detallados
    const movimientosRes = await axiosWrapper.get(
      `${API_URL}/api/cash-register?shift_id=${turnoSeleccionado}`
    );
    const movimientos = movimientosRes.data?.data || [];

    // 3. Preparar los datos para el componente
    setCorteInfo({
      turnoId: turnoSeleccionado,
      cajero: corteData.cajero || user?.name || "N/A",
      inicio: corteData.inicio, // Formato: "YYYY-MM-DD HH:mm:ss"
      cierre: corteData.cierre || "En curso",
      totalOrdenes: corteData.totalOrdenes || 0,
      totalEfectivo: corteData.totalEfectivo || 0,
      totalTarjeta: corteData.totalTarjeta || 0,
      countEfectivo: corteData.countEfectivo || 0,
      countTarjeta: corteData.countTarjeta || 0,
      ordenesPagadas: corteData.ordenes || 0,
      ingresos: corteData.ingresos || 0,
      egresos: corteData.egresos || 0,
      total: corteData.total || 0,
      movimientos: corteData.movimientos || movimientos.length
    });

    setShowCorteModal(true);
    enqueueSnackbar("Corte generado correctamente", { variant: "success" });
  } catch (err) {
    console.error("Error al generar corte:", err);
    enqueueSnackbar("Error al generar ticket de corte", { 
      variant: "error",
      message: err.response?.data?.message || err.message 
    });
  }
};

const fetchTurnos = async () => {
  try {
    const res = await axiosWrapper.get(`${API_URL}/api/shifts`);
    setTurnos(res.data || []);
  } catch (error) {
    console.error("Error al obtener turnos:", error);
    enqueueSnackbar("No se pudieron cargar los turnos", { variant: "error" });
  }
};




  

  const fetchCashbox = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cash-balance`);
      setTotalCash(res.data.total || 0);
    } catch (err) {
      console.error("Error al obtener el total de caja:", err);
    }
  };

  const fetchCashMovements = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/cash-register`); // o la ruta correcta
      setCashMovements(res.data || []);
    } catch (err) {
      console.error("Error al obtener movimientos de caja:", err);
    }
  };

  const [description, setDescription] = useState("");

// 2. Modifica tu handleSubmit
const handleSubmit = async () => {
  if (!amount || isNaN(amount)) {
    enqueueSnackbar("Ingresa un monto válido", { variant: "error" });
    return;
  }

  try {
    await axiosWrapper.post(`${API_URL}/api/admin/cash-movement`, {
      type,
      amount: parseFloat(amount),
      description: description || `Movimiento manual: ${type}`, // Usa la descripción del usuario o una por defecto
      user_id: user?.id // Asegúrate de enviar el user_id
    });

    queryClient.invalidateQueries(["cash-movements"]);
    setAmount("");
    setDescription(""); // Limpiar el campo después de enviar
    await Promise.all([fetchCashbox(), fetchCashMovements()]);
    enqueueSnackbar("Movimiento registrado correctamente", { variant: "success" });
  } catch (err) {
    console.error("Error al registrar movimiento:", err);
    enqueueSnackbar(`Error al registrar movimiento: ${err.response?.data?.message || err.message}`, { 
      variant: "error" 
    });
  }
};

  const queryClient = useQueryClient();


const { data: resData, isError } = useQuery({
  queryKey: ["orders"],
  queryFn: getCashMovements,
  placeholderData: keepPreviousData,
});

if (isError) {
  enqueueSnackbar("Something went wrong!", { variant: "error" });
  return null;
}

const orders = resData?.data?.data || [];

useEffect(() => {
  const loadData = async () => {
    await fetchCashbox();
    await fetchCashMovements();
    await fetchTurnos(); 
    setLoading(false);
  };

  loadData();
}, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Caja</h1>
            <p className="text-gray-600 mt-1">Gestión de caja y movimientos</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm px-4 py-2">
            <span className="text-gray-500 text-sm">Saldo actual</span>
            <div className="text-2xl font-bold text-green-600">${Number(totalCash || 0).toFixed(2)}</div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
              activeTab === "cash" 
                ? "bg-white text-blue-600 border-t border-l border-r border-gray-200 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("cash")}
          >
            Gestión de Caja
          </button>
        </div>
        
        {/* Cash Management Section */}
        {activeTab === "cash" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Movimientos de Caja</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash Summary */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumen de Caja</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-gray-500">Saldo actual</div>
                    <div className="text-2xl font-bold text-gray-800">${Number(totalCash || 0).toFixed(2)}</div>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Ingresos hoy</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Retiros hoy</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Movimientos totales</span>
                      <span className="font-medium">{cashMovements.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Cash Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Registrar movimiento</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setType("ingreso")}
                          className={`flex-1 py-2 px-4 rounded-lg text-center border transition-colors duration-200 ${
                            type === "ingreso"
                              ? "bg-green-50 text-green-800 border-green-200 shadow-inner"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                          }`}
                        >
                          Ingreso
                        </button>
                        <button
                          onClick={() => setType("retiro")}
                          className={`flex-1 py-2 px-4 rounded-lg text-center border transition-colors duration-200 ${
                            type === "retiro"
                              ? "bg-red-50 text-red-800 border-red-200 shadow-inner"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                          }`}
                        >
                          Retiro
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Monto
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                        <input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                   <div>
  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
    Descripción (opcional)
  </label>
  <input
    type="text"
    id="description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Ej: Ingreso por ventas"
    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
  />
</div>
                    
                    <button
                      onClick={handleSubmit}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                      Registrar Movimiento
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 mt-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Corte de Caja por Turno</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label htmlFor="turno" className="block text-sm font-medium text-gray-700 mb-1">
                      Selecciona un turno
                    </label>
                    <select
                      id="turno"
                      value={turnoSeleccionado}
                      onChange={(e) => setTurnoSeleccionado(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Selecciona --</option>
                      {turnos.map((turno) => (
                        <option key={turno.id} value={turno.id}>
                          Turno #{turno.id} - {formatDateAndTime(turno.start_time)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={handleCorte}
                      className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                      Generar Corte
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Recent Transactions */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimos movimientos</h3>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mesero
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Turno
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hora y Fecha
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors duration-150" 
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">#{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.user_name || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Turno #{order.shift_id || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.date ? formatDateAndTime(order.date) : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.description || "N/A"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={order.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                ${Number(order.amount).toFixed(2) || "0.00"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {order.payment_method || "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No hay movimientos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCorteModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md text-black">
      <CorteTicket corte={corteInfo} onClose={() => setShowCorteModal(false)} />
    </div>
  </div>
)}
    </div>
  );
}

export default CashierDashboard;