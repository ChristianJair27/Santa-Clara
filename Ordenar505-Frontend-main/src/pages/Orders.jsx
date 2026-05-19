import { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { useSnackbar } from "notistack";
import Invoice from "../components/invoice/Invoice";
import { FiRefreshCw } from "react-icons/fi";
import { FaUtensils } from "react-icons/fa";
import { MdReceiptLong, MdCheckCircle, MdPending } from "react-icons/md";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, type: "spring", stiffness: 260, damping: 24 },
  }),
};

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice,   setShowInvoice]   = useState(false);
  const [filter,        setFilter]        = useState("progress");
  const { enqueueSnackbar } = useSnackbar();

  const userData = useSelector((s) => s.user);
  const role     = String(userData?.role || "").toLowerCase();
  const isAdmin  = role === "admin";

  useEffect(() => {
    document.title = "Santa Clara | Órdenes";
  }, []);

  const { data: ordersResponse, isError, isLoading, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (isError) enqueueSnackbar("Error al cargar las órdenes", { variant: "error" });
  }, [isError, enqueueSnackbar]);

  const allOrders = ordersResponse?.data?.data || [];

  /* ── Filtrar por usuario actual (admin ve todo) ── */
  const myOrders = isAdmin
    ? allOrders
    : allOrders.filter((o) =>
        String(o.user_id ?? o.waiter_id ?? "") === String(userData?.id ?? "")
      );

  /* ── Filtrar por estado ── */
  const filteredOrders = myOrders.filter((o) => {
    const s = String(o.order_status || o.status || "").toLowerCase();
    if (filter === "progress") {
      return !s.includes("complete") && !s.includes("pagado") &&
             !s.includes("cancel")   && !s.includes("finaliz");
    }
    return s.includes("complete") || s.includes("pagado") || s.includes("finaliz");
  });

  const inProgressCount  = myOrders.filter((o) => {
    const s = String(o.order_status || o.status || "").toLowerCase();
    return !s.includes("complete") && !s.includes("pagado") && !s.includes("cancel") && !s.includes("finaliz");
  }).length;

  const completedCount = myOrders.filter((o) => {
    const s = String(o.order_status || o.status || "").toLowerCase();
    return s.includes("complete") || s.includes("pagado") || s.includes("finaliz");
  }).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-28">

      {/* ══ HEADER ══ */}
      <motion.header
        className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-white text-lg font-bold leading-tight">
              {isAdmin ? "Todas las Órdenes" : "Mis Órdenes"}
            </h1>
            <p className="text-gray-300 text-[11px] mt-0.5">
              {myOrders.length} orden{myOrders.length !== 1 ? "es" : ""} • {isAdmin ? "Vista administrador" : userData?.name}
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => refetch()}
          className="bg-white/15 text-white p-2.5 rounded-xl hover:bg-white/25 transition"
          whileTap={{ scale: 0.9 }}
          title="Actualizar"
        >
          <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </motion.button>
      </motion.header>

      {/* ══ FILTROS ══ */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <button
            onClick={() => setFilter("progress")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === "progress"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MdPending size={16} />
            En Progreso
            {inProgressCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filter === "progress" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
              }`}>
                {inProgressCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === "completed"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MdCheckCircle size={16} />
            Completadas
            {completedCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filter === "completed" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
              }`}>
                {completedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══ CONTENIDO ══ */}
      <main className="flex-1 overflow-auto px-4 py-3">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {filteredOrders.map((order, i) => (
              <motion.div key={order.id} custom={i} variants={fadeUp}>
                <OrderCard
                  order={order}
                  isCompleted={filter === "completed"}
                  onInvoiceClick={() => { setSelectedOrder(order); setShowInvoice(true); }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-amber-50 rounded-full p-5 mb-4">
              <FaUtensils className="text-amber-300 text-3xl" />
            </div>
            <p className="text-gray-600 font-semibold text-base">
              {filter === "progress" ? "No hay órdenes en progreso" : "No hay órdenes completadas"}
            </p>
            <p className="text-gray-400 text-sm mt-1 mb-4">
              {myOrders.length > 0
                ? `Cambia el filtro para ver las órdenes ${filter === "progress" ? "completadas" : "en progreso"}`
                : "No tienes órdenes registradas"}
            </p>
            <button onClick={() => refetch()}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
              Actualizar
            </button>
          </div>
        )}
      </main>

      <BottomNav />

      {/* ══ MODAL FACTURA ══ */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <Invoice orderInfo={selectedOrder} setShowInvoice={setShowInvoice} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
