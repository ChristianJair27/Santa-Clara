import { useEffect, useState, useRef, useMemo } from "react";
import AddCategoryModal from "./AddCategoryModal";
import AddDishModal from "./AddDishModal";
import AddUserModal from "./AddUserModal";
import AddTableModal from "./AddTableModal";
import CorteTicket from "../corte/CorteTicket";
import { MdCategory, MdTableRestaurant, MdPointOfSale } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { BsCashStack } from "react-icons/bs";
import {
  FiUsers, FiDollarSign, FiBarChart2, FiRefreshCw,
  FiTrendingUp, FiPlus, FiSearch, FiEdit2, FiTrash2,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import { useSelector } from "react-redux";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";
import { formatDateAndTime } from "../../utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, type: "spring", stiffness: 260, damping: 24 },
  }),
};

// ── Pequeña stat card reutilizable ─────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "indigo", icon }) => {
  const colors = {
    indigo: "from-gray-800 to-gray-900",
    emerald: "from-emerald-500 to-emerald-700",
    violet: "from-amber-500 to-amber-600",
    amber: "from-amber-500 to-amber-700",
    blue: "from-blue-500 to-blue-700",
    rose: "from-rose-500 to-rose-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-md`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{label}</p>
        <span className="text-white/50 text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-black leading-none">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-1.5">{sub}</p>}
    </div>
  );
};

// ── Badge de rol ────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    admin:   "bg-amber-100 text-amber-800",
    cajero:  "bg-blue-100 text-blue-800",
    mesero:  "bg-emerald-100 text-emerald-700",
    waiter:  "bg-emerald-100 text-emerald-700",
    cashier: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${map[role?.toLowerCase()] ?? "bg-gray-100 text-gray-700"}`}>
      {role}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const Metrics = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  // ✅ FIX: era state.user.user (incorrecto) → ahora state.user
  const user = useSelector((state) => state.user);

  // ── State ──────────────────────────────────────────────────────────────────
  const [totalCash,    setTotalCash]    = useState(0);
  const [amount,       setAmount]       = useState("");
  const [type,         setType]         = useState("ingreso");
  const [description,  setDescription]  = useState("");

  const [categories,        setCategories]        = useState([]);
  const [dishes,            setDishes]            = useState([]);
  const [editCategory,      setEditCategory]      = useState(null);
  const [editDish,          setEditDish]          = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDishModalOpen,   setIsDishModalOpen]   = useState(false);

  const [tables,          setTables]          = useState([]);
  const [isTableModalOpen,setIsTableModalOpen]= useState(false);
  const [editTable,       setEditTable]       = useState(null);

  const [users,           setUsers]           = useState([]);
  const [isAddUserOpen,   setIsAddUserOpen]   = useState(false);
  const [editingUser,     setEditingUser]     = useState(null);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [roleFilter,      setRoleFilter]      = useState("all");
  const [userToDelete,    setUserToDelete]    = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [turnos,           setTurnos]           = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  const [corteInfo,        setCorteInfo]         = useState(null);
  const [showCorteModal,   setShowCorteModal]    = useState(false);
  const corteRef = useRef();

  const [activeTab, setActiveTab] = useState("cash");

  const [reportStartDate,  setReportStartDate]  = useState("");
  const [reportEndDate,    setReportEndDate]    = useState("");
  const [salesSummary,     setSalesSummary]     = useState(null);
  const [topDishes,        setTopDishes]        = useState([]);
  const [paymentMethods,   setPaymentMethods]   = useState(null);
  const [loadingReports,   setLoadingReports]   = useState(false);
  const [topWaiters,       setTopWaiters]       = useState([]);
  const [salesByHour,      setSalesByHour]      = useState([]);
  const [comparison,       setComparison]       = useState(null);
  const [topKitchenTips,   setTopKitchenTips]   = useState([]);
  const [totalKitchenTips, setTotalKitchenTips] = useState(0);
  const [aiAnalysis,       setAiAnalysis]       = useState("");
  const [loadingAI,        setLoadingAI]        = useState(false);

  // ── Fetch functions ────────────────────────────────────────────────────────
  // ✅ FIX: Ahora todos usan axiosWrapper (con token) + try/catch

  const fetchCashbox = async () => {
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/cash-balance`);
      setTotalCash(res.data?.total ?? res.data?.balance ?? 0);
    } catch (err) { console.error("fetchCashbox:", err); }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/categories`);
      setCategories(res.data?.data || res.data || []);
    } catch (err) { console.error("fetchCategories:", err); }
  };

  const fetchDishes = async () => {
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/dishes`);
      setDishes(res.data?.data || res.data || []);
    } catch (err) { console.error("fetchDishes:", err); }
  };

  const fetchTables = async () => {
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/table`);
      setTables(res.data?.data || res.data || []);
    } catch (err) { console.error("fetchTables:", err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosWrapper.get("/api/user");
      setUsers(res.data?.data || res.data || []);
    } catch (err) { setUsers([]); }
  };

  const fetchTurnos = async () => {
    try {
      const res = await axiosWrapper.get(`${API_URL}/api/shifts`);
      setTurnos(res.data?.data || res.data || []);
    } catch { enqueueSnackbar("No se pudieron cargar los turnos", { variant: "error" }); }
  };

  // ── Movimientos de caja (useQuery) ─────────────────────────────────────────
  const { data: resData, refetch: refetchMovimientos, isLoading: movLoading } = useQuery({
    queryKey: ["cashMovements"],
    queryFn: () =>
      axiosWrapper.get(`${API_URL}/api/cash-register`).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const movements = resData?.data || [];

  // Stats de hoy desde los movimientos
  const todayStr = new Date().toLocaleDateString("es-ES");
  const todayStats = useMemo(() => {
    const todays = movements.filter((m) => {
      const d = m.date ? new Date(m.date).toLocaleDateString("es-ES") : "";
      return d === todayStr;
    });
    const sales    = todays.filter((m) => m.type === "venta").reduce((s, m) => s + Number(m.amount || 0), 0);
    const ingresos = todays.filter((m) => m.type === "ingreso").reduce((s, m) => s + Number(m.amount || 0), 0);
    const retiros  = todays.filter((m) => m.type === "retiro").reduce((s, m) => s + Number(m.amount || 0), 0);
    const ordenes  = new Set(todays.filter((m) => m.order_id).map((m) => m.order_id)).size;
    return { sales, ingresos, retiros, ordenes };
  }, [movements, todayStr]);

  // ── Acciones ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!amount || isNaN(amount)) {
      enqueueSnackbar("Ingresa un monto válido", { variant: "error" });
      return;
    }
    try {
      await axiosWrapper.post(`${API_URL}/api/admin/cash-movement`, {
        type,
        amount: parseFloat(amount),
        description: description || `Movimiento manual: ${type}`,
        user_id: user?.id,
      });
      setAmount(""); setDescription("");
      await Promise.all([fetchCashbox(), refetchMovimientos()]);
      enqueueSnackbar("Movimiento registrado", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(`Error: ${err.response?.data?.message || err.message}`, { variant: "error" });
    }
  };

  const handleCorte = async () => {
    if (!turnoSeleccionado) {
      enqueueSnackbar("Selecciona un turno válido", { variant: "error" });
      return;
    }
    try {
      const [corteRes, movRes] = await Promise.all([
        axiosWrapper.get(`${API_URL}/api/shifts/${turnoSeleccionado}/corte`),
        axiosWrapper.get(`${API_URL}/api/cash-register?shift_id=${turnoSeleccionado}`),
      ]);
      const d = corteRes.data;
      setCorteInfo({
        turnoId: turnoSeleccionado,
        cajero: d.cajero || user?.name || "N/A",
        inicio: d.inicio, cierre: d.cierre || "En curso",
        totalOrdenes: d.totalOrdenes || 0,
        totalEfectivo: d.totalEfectivo || 0,
        totalTarjeta: d.totalTarjeta || 0,
        countEfectivo: d.countEfectivo || 0,
        countTarjeta: d.countTarjeta || 0,
        ordenesPagadas: d.ordenes || 0,
        ingresos: d.ingresos || 0,
        egresos: d.egresos || 0,
        total: d.total || 0,
        movimientos: (movRes.data?.data || []).length,
      });
      setShowCorteModal(true);
      enqueueSnackbar("Corte generado", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Error al generar corte", { variant: "error" });
    }
  };

  const handleDeleteUser = (userId) => { setUserToDelete(userId); setShowDeleteConfirm(true); };
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axiosWrapper.delete(`/api/user/${userToDelete}`);
      enqueueSnackbar("Usuario eliminado", { variant: "success" });
      fetchUsers();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "No se pudo eliminar", { variant: "error" });
    } finally { setShowDeleteConfirm(false); setUserToDelete(null); }
  };

  // ── Reportes ───────────────────────────────────────────────────────────────
  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setReportStartDate(start.toISOString().split("T")[0]);
    setReportEndDate(end.toISOString().split("T")[0]);
  };

  const generateReports = async () => {
    if (!reportStartDate || !reportEndDate) {
      enqueueSnackbar("Selecciona fechas válidas", { variant: "warning" });
      return;
    }
    setLoadingReports(true);
    try {
      const p = `?start=${reportStartDate}&end=${reportEndDate}`;
      const [sumRes, dishRes, payRes, waiterRes, hourRes, compRes, kitRes] = await Promise.all([
        axiosWrapper.get(`${API_URL}/api/reports/sales-summary${p}`),
        axiosWrapper.get(`${API_URL}/api/reports/top-dishes${p}`),
        axiosWrapper.get(`${API_URL}/api/reports/payment-methods${p}`),
        axiosWrapper.get(`${API_URL}/api/reports/top-waiters${p}`),
        axiosWrapper.get(`${API_URL}/api/reports/sales-by-hour${p}`),
        axiosWrapper.get(`${API_URL}/api/reports/comparison${p}`),
        axiosWrapper.get(`${API_URL}/api/reports/top-kitchen-tips${p}`),
      ]);
      setSalesSummary(sumRes.data);
      setTopDishes(dishRes.data?.top10 || []);
      setPaymentMethods(payRes.data);
      setTopWaiters(waiterRes.data?.top10 || []);
      setSalesByHour(hourRes.data?.hours || []);
      setComparison(compRes.data);
      setTopKitchenTips(kitRes.data?.top10 || []);
      setTotalKitchenTips(
        (kitRes.data?.top10 || []).reduce((s, w) => s + parseFloat(w.kitchen_tips || 0), 0)
      );
      enqueueSnackbar("Reportes generados", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Error al cargar reportes", { variant: "error" });
    } finally { setLoadingReports(false); }
  };

  const generateAIAnalysis = async () => {
    if (!salesSummary) { enqueueSnackbar("Genera los reportes primero", { variant: "warning" }); return; }
    setLoadingAI(true); setAiAnalysis("");
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await axiosWrapper.post(`${API_URL}/api/reports/ai-analysis`, {
        salesSummary, topDishes, topWaiters, topKitchenTips, totalKitchenTips,
        paymentMethods: paymentMethods || { cash: 0, card: 0, other: 0 },
        salesByHour, comparison, start: reportStartDate, end: reportEndDate,
      }, { timeout: 600000 });
      setAiAnalysis(res.data?.analysis || "Análisis generado pero sin contenido.");
      enqueueSnackbar("¡Análisis IA listo!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message || "Error en análisis IA", { variant: "error" });
    } finally { setLoadingAI(false); }
  };

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setReportStartDate(today);
    setReportEndDate(today);
    Promise.all([fetchCashbox(), fetchCategories(), fetchDishes(), fetchTables(), fetchUsers(), fetchTurnos()]);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "all" || u.role?.toLowerCase() === roleFilter;
    return matchSearch && matchRole;
  });

  const occupiedCount = tables.filter((t) => ["ocupado", "ocupada"].includes(t.status?.toLowerCase())).length;

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "cash",    label: "Caja",          icon: <MdPointOfSale size={16} /> },
    { key: "menu",    label: "Menú",          icon: <BiSolidDish size={16} /> },
    { key: "users",   label: "Usuarios",      icon: <FiUsers size={14} /> },
    { key: "tables",  label: "Mesas",         icon: <MdTableRestaurant size={16} /> },
    { key: "reports", label: "Reportes & IA", icon: <FiBarChart2 size={14} /> },
  ];

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ── RESUMEN RÁPIDO (siempre visible) ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial="hidden" animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <StatCard label="Saldo Caja" value={`$${Number(totalCash).toFixed(2)}`} icon={<FiDollarSign />} color="emerald" />
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <StatCard label="Ventas Hoy" value={`$${todayStats.sales.toFixed(2)}`} sub={`${todayStats.ordenes} órdenes`} icon={<FiTrendingUp />} color="indigo" />
        </motion.div>
        <motion.div variants={fadeUp} custom={2}>
          <StatCard label="Mesas Activas" value={occupiedCount} sub={`de ${tables.length} total`} icon={<MdTableRestaurant />} color="violet" />
        </motion.div>
        <motion.div variants={fadeUp} custom={3}>
          <StatCard label="Usuarios" value={users.length} sub={`${users.filter(u => u.role === "admin").length} admin`} icon={<FiUsers />} color="blue" />
        </motion.div>
      </motion.div>

      {/* ── TABS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-gray-900 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >

          {/* ══ CAJA ══════════════════════════════════════════════════════════ */}
          {activeTab === "cash" && (
            <div className="space-y-5">

              {/* Stats de hoy */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
                  <BsCashStack className="text-emerald-500 text-2xl mb-1" />
                  <p className="text-xs text-gray-400 font-medium">Efectivo Hoy</p>
                  <p className="text-xl font-black text-emerald-700">${(todayStats.sales).toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
                  <FiTrendingUp className="text-indigo-500 text-2xl mb-1" />
                  <p className="text-xs text-gray-400 font-medium">Ingresos</p>
                  <p className="text-xl font-black text-amber-700">${todayStats.ingresos.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center">
                  <FiTrendingUp className="text-red-400 text-2xl mb-1 rotate-180" />
                  <p className="text-xs text-gray-400 font-medium">Retiros</p>
                  <p className="text-xl font-black text-red-600">${todayStats.retiros.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Registrar movimiento */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MdPointOfSale className="text-amber-600" /> Registrar Movimiento
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => setType("ingreso")}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${type === "ingreso" ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        ↑ Ingreso
                      </button>
                      <button onClick={() => setType("retiro")}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${type === "retiro" ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        ↓ Retiro
                      </button>
                    </div>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder="Monto ($)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción (opcional)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" />
                    <button onClick={handleSubmit}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition shadow-md">
                      Registrar
                    </button>
                  </div>
                </div>

                {/* Corte de caja */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiDollarSign className="text-amber-600" /> Corte de Caja por Turno
                  </h3>
                  <div className="space-y-3">
                    <select value={turnoSeleccionado} onChange={(e) => setTurnoSeleccionado(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none">
                      <option value="">-- Selecciona un turno --</option>
                      {turnos.map((t) => (
                        <option key={t.id} value={t.id}>
                          Turno #{t.id} — {t.start_time ? formatDateAndTime(t.start_time) : "Sin fecha"}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleCorte}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition shadow-md">
                      Generar Corte
                    </button>
                  </div>
                  {turnos.length === 0 && (
                    <p className="text-gray-400 text-xs mt-3 text-center">No hay turnos registrados</p>
                  )}
                </div>
              </div>

              {/* Tabla de movimientos */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-900">Movimientos Recientes</h3>
                  <button onClick={() => refetchMovimientos()}
                    className="text-amber-600 hover:text-amber-800 flex items-center gap-1.5 text-sm font-medium">
                    <FiRefreshCw size={13} className={movLoading ? "animate-spin" : ""} />
                    Actualizar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mesero</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {movements.slice(0, 30).map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-sm text-gray-500">#{m.id}</td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-700">{m.waiter_name || "—"}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">{m.date ? formatDateAndTime(m.date) : "—"}</td>
                          <td className="px-5 py-3 text-sm text-gray-600 max-w-[180px] truncate">{m.description || "—"}</td>
                          <td className={`px-5 py-3 text-sm font-bold text-right ${m.type === "retiro" ? "text-red-600" : "text-emerald-700"}`}>
                            {m.type === "retiro" ? "-" : "+"}${Number(m.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              m.payment_method === "tarjeta" || m.payment_method === "card"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {m.payment_method || "efectivo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {movements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                            No hay movimientos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ MENÚ ════════════════════════════════════════════════════════ */}
          {activeTab === "menu" && (
            <div className="space-y-5">
              {/* Categorías */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <MdCategory className="text-amber-600" /> Categorías ({categories.length})
                  </h2>
                  <button onClick={() => setIsCategoryModalOpen(true)}
                    className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
                    <FiPlus size={14} /> Nueva
                  </button>
                </div>
                {categories.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Sin categorías registradas</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition">
                        <div className="h-1.5 w-full" style={{ backgroundColor: cat.bg_color || "#6366f1" }} />
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{cat.icon}</span>
                            <h3 className="text-sm font-bold text-gray-900 truncate">{cat.name}</h3>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              {dishes.filter((d) => d.category_id === cat.id).length} platillos
                            </p>
                            <button onClick={() => setEditCategory(cat)}
                              className="text-amber-600 hover:text-amber-800 text-xs font-semibold">
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Platillos */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BiSolidDish className="text-amber-600" /> Platillos ({dishes.length})
                  </h2>
                  <button onClick={() => setIsDishModalOpen(true)}
                    className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
                    <FiPlus size={14} /> Nuevo
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Img</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platillo</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dishes.map((dish) => (
                        <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            {dish.image_path ? (
                              <img src={`${API_URL}${dish.image_path}`} alt={dish.name}
                                className="w-12 h-12 object-cover rounded-xl border border-gray-200"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 border border-dashed border-gray-200">
                                <BiSolidDish size={18} />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-semibold text-gray-900">{dish.name}</p>
                            {dish.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">{dish.description}</p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-emerald-700">
                            ${Number(dish.price).toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{dish.category_name || "—"}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => setEditDish(dish)}
                              className="text-amber-600 hover:text-amber-800 text-sm font-semibold mr-4">
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {dishes.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Sin platillos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ USUARIOS ════════════════════════════════════════════════════ */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FiUsers className="text-amber-600" /> Usuarios ({filteredUsers.length})
                </h2>
                <button onClick={() => { setEditingUser(null); setIsAddUserOpen(true); }}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
                  <FiPlus size={14} /> Nuevo
                </button>
              </div>

              {/* Filtros */}
              <div className="px-5 py-3 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Buscar por nombre, email o rol..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none" />
                </div>
                <div className="flex gap-1.5">
                  {["all", "admin", "cajero", "mesero"].map((r) => (
                    <button key={r} onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        roleFilter === r ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {r === "all" ? "Todos" : r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {(u.name || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                        <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => { setEditingUser(u); setIsAddUserOpen(true); }}
                            className="text-amber-600 hover:text-amber-800 mr-3">
                            <FiEdit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700">
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">No hay usuarios que coincidan</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ MESAS ═══════════════════════════════════════════════════════ */}
          {activeTab === "tables" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MdTableRestaurant className="text-amber-600" /> Mesas ({tables.length})
                </h2>
                <button onClick={() => setIsTableModalOpen(true)}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition">
                  <FiPlus size={14} /> Nueva Mesa
                </button>
              </div>
              {tables.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-12">Sin mesas registradas</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5">
                  {tables.map((t) => {
                    const isOc = ["ocupado", "ocupada"].includes(t.status?.toLowerCase());
                    return (
                      <div key={t.id}
                        className={`rounded-2xl p-4 border-2 transition text-center ${
                          isOc ? "bg-orange-50 border-orange-300" : "bg-emerald-50 border-emerald-200"
                        }`}>
                        <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-lg ${
                          isOc ? "bg-orange-500 text-white" : "bg-emerald-500 text-white"
                        }`}>
                          {t.table_no}
                        </div>
                        <p className="text-xs font-semibold text-gray-700">{t.seats} asientos</p>
                        <span className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOc ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {isOc ? "Ocupada" : "Libre"}
                        </span>
                        <button onClick={() => setEditTable(t)}
                          className="block w-full mt-2 text-amber-600 hover:text-amber-800 text-xs font-semibold">
                          Editar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ REPORTES & IA ═══════════════════════════════════════════════ */}
          {activeTab === "reports" && (
            <div className="space-y-5">
              {/* Filtros de fecha */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiBarChart2 className="text-amber-600" /> Filtros de Reporte
                </h2>
                {/* Quick buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: "Hoy",      days: 1  },
                    { label: "7 días",   days: 7  },
                    { label: "15 días",  days: 15 },
                    { label: "30 días",  days: 30 },
                  ].map((q) => (
                    <button key={q.label} onClick={() => setQuickRange(q.days)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition">
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Desde</label>
                    <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hasta</label>
                    <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={generateReports} disabled={loadingReports}
                      className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition">
                      {loadingReports ? "Generando..." : "Generar Reportes"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Métricas clave */}
              {salesSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard label="Ventas Totales"  value={`$${salesSummary.totalSales?.toFixed(0)}`}  color="indigo" icon={<FiDollarSign />} />
                  <StatCard label="Órdenes"          value={salesSummary.totalOrders}                   color="blue"   icon={<FiTrendingUp />} />
                  <StatCard label="Ticket Promedio"  value={`$${salesSummary.avgTicket?.toFixed(0)}`}   color="violet" icon={<FiBarChart2 />} />
                  <StatCard label="Clientes"          value={salesSummary.totalCustomers}                color="amber"  icon={<FiUsers />} />
                  <StatCard label="Propinas Cocina"  value={`$${totalKitchenTips.toFixed(0)}`}          color="emerald" icon={<FiDollarSign />} />
                </div>
              )}

              {/* Comparación período */}
              {comparison && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Comparación con período anterior</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    {[
                      { label: "Ventas", curr: comparison.current?.totalSales, prev: comparison.previous?.totalSales },
                      { label: "Órdenes", curr: comparison.current?.totalOrders, prev: comparison.previous?.totalOrders },
                      { label: "Ticket Prom.", curr: comparison.current?.avgTicket, prev: comparison.previous?.avgTicket },
                    ].map(({ label, curr, prev }) => {
                      const pct = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : null;
                      return (
                        <div key={label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 font-medium">{label}</p>
                          <p className="text-lg font-black text-gray-900">
                            {typeof curr === "number" ? (label === "Órdenes" ? curr : `$${curr?.toFixed(0)}`) : "—"}
                          </p>
                          {pct !== null && (
                            <p className={`text-xs font-bold mt-0.5 ${Number(pct) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {Number(pct) >= 0 ? "▲" : "▼"} {Math.abs(pct)}%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* IA */}
              {salesSummary && (
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaRobot /> Análisis con IA
                      </h2>
                      <p className="text-gray-300 text-sm mt-1">Insights y recomendaciones para tu restaurante</p>
                    </div>
                    <button onClick={generateAIAnalysis} disabled={loadingAI}
                      className="bg-white text-purple-700 hover:bg-gray-100 font-bold py-2.5 px-6 rounded-xl shadow-lg transition disabled:opacity-60 flex items-center gap-2 text-sm whitespace-nowrap">
                      {loadingAI ? (
                        <><div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />Analizando...</>
                      ) : "Generar Análisis"}
                    </button>
                  </div>
                  {loadingAI && !aiAnalysis && (
                    <div className="bg-white/10 rounded-xl p-8 text-center">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-white font-bold">Procesando con IA...</p>
                      <p className="text-gray-300 text-sm mt-1">Puede tomar 1-4 minutos</p>
                    </div>
                  )}
                  {aiAnalysis && (
                    <div className="bg-white rounded-xl p-5 shadow">
                      <div className="whitespace-pre-line text-sm text-gray-800 leading-relaxed">{aiAnalysis}</div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button onClick={() => { navigator.clipboard.writeText(aiAnalysis); enqueueSnackbar("Copiado", { variant: "success" }); }}
                          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition">
                          Copiar análisis
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gráficos */}
              {(topDishes.length > 0 || topWaiters.length > 0 || salesByHour.length > 0 || paymentMethods) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {topDishes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Top Platillos Más Vendidos</h3>
                      <Bar
                        data={{
                          labels: topDishes.map((d) => d.name.length > 20 ? d.name.slice(0, 20) + "…" : d.name),
                          datasets: [{ data: topDishes.map((d) => d.total_sales), backgroundColor: "#6366f1", borderRadius: 8 }],
                        }}
                        options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
                      />
                    </div>
                  )}
                  {topWaiters.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Top Meseros por Ventas</h3>
                      <Bar
                        data={{
                          labels: topWaiters.map((w) => w.name?.length > 20 ? w.name.slice(0, 20) + "…" : w.name),
                          datasets: [{ data: topWaiters.map((w) => w.total_sales), backgroundColor: "#10b981", borderRadius: 8 }],
                        }}
                        options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
                      />
                    </div>
                  )}
                  {salesByHour.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Ventas por Hora</h3>
                      <Line
                        data={{
                          labels: salesByHour.map((h) => `${h.hour}:00`),
                          datasets: [{
                            data: salesByHour.map((h) => h.total_sales),
                            borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)",
                            tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3,
                          }],
                        }}
                        options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
                      />
                    </div>
                  )}
                  {paymentMethods && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Métodos de Pago</h3>
                      <div className="max-w-xs mx-auto">
                        <Pie
                          data={{
                            labels: ["Efectivo", "Tarjeta", "Otros"],
                            datasets: [{ data: [paymentMethods.cash, paymentMethods.card, paymentMethods.other], backgroundColor: ["#10b981", "#6366f1", "#f59e0b"] }],
                          }}
                          options={{ responsive: true }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ══ MODALES ══════════════════════════════════════════════════════════ */}
      {isCategoryModalOpen && (
        <AddCategoryModal setIsOpen={setIsCategoryModalOpen} onClose={fetchCategories} />
      )}
      {editCategory && (
        <AddCategoryModal setIsOpen={() => setEditCategory(null)} initialData={editCategory} isEditing onClose={fetchCategories} />
      )}
      {isDishModalOpen && (
        <AddDishModal setIsOpen={setIsDishModalOpen} onClose={fetchDishes} />
      )}
      {editDish && (
        <AddDishModal setIsOpen={() => setEditDish(null)} initialData={editDish} isEditing onClose={fetchDishes} />
      )}
      {isTableModalOpen && (
        <AddTableModal setIsOpen={setIsTableModalOpen} onTableAdded={fetchTables} />
      )}
      {editTable && (
        <AddTableModal setIsOpen={() => setEditTable(null)} initialData={editTable} isEditing onTableAdded={fetchTables} />
      )}
      {isAddUserOpen && (
        <AddUserModal setIsOpen={setIsAddUserOpen} onUserAdded={fetchUsers} initialData={editingUser} />
      )}

      {/* Confirmar eliminar usuario */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="px-5 py-4 bg-red-50 border-b border-red-100">
              <h3 className="text-base font-bold text-red-800">¿Eliminar usuario?</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button onClick={confirmDeleteUser}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
                  Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal corte */}
      {showCorteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl">
            <CorteTicket corte={corteInfo} onClose={() => setShowCorteModal(false)} ref={corteRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Metrics;
