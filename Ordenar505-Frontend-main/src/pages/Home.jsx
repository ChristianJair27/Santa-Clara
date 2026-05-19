import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/shared/BottomNav";
import { motion } from "framer-motion";
import { FiUser, FiClock } from "react-icons/fi";
import { GiCookingPot } from "react-icons/gi";
import { BsCashStack } from "react-icons/bs";
import { FaArrowRight, FaSignInAlt, FaSignOutAlt, FaCreditCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosWrapper } from "../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";
import { getTables } from "../https";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const normalizeStatus = (raw) => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (["ocupado", "ocupada", "occupied", "busy", "en uso", "en-uso", "booked"].includes(s)) return "ocupado";
  return s;
};

/* Contador animado */
const Counter = ({ value, decimals = 0 }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return;
    let frame, start = null;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 750, 1);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{typeof value === "number" ? n.toFixed(decimals) : "—"}</>;
};

const Home = () => {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const API_URL     = import.meta.env.VITE_BACKEND_URL;
  const userData    = useSelector((s) => s.user);

  const role      = String(userData?.role || userData?.user?.role || "").toLowerCase();
  const isWaiter  = ["mesero", "waiter"].includes(role);
  const isCashier = ["cajero", "cashier"].includes(role) || role === "admin";
  const isAdmin   = role === "admin";

  const waiterName = useMemo(() => {
    const n = userData?.name || userData?.full_name || userData?.username || "";
    return n.trim().toLowerCase();
  }, [userData]);

  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);

  const greeting = useMemo(() => {
    const h = now.getHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  }, [now]);

  /* ── Helpers de orden ── */
  const extractOid = (t = {}) =>
    t.current_order_id ?? t.order_id ?? t.active_order_id ??
    t.order?.id ?? t.order?._id ?? t.currentOrderId ?? t.activeOrderId ?? null;

  const fetchOidForTable = async (table) => {
    const tid = table?.table_id ?? table?.tableId ?? table?.id ?? table?.table_no ?? null;
    if (!tid) return null;
    try {
      const r = await axiosWrapper.get(`${API_URL}/api/orders/active-by-table/${tid}`);
      return r?.data?.data?.id ?? r?.data?.id ?? null;
    } catch {}
    try {
      const r = await axiosWrapper.get(`${API_URL}/api/orders`, {
        params: { table_id: tid, status: "inprogress", limit: 1, sort: "-created_at" },
      });
      const arr = r?.data?.data ?? r?.data ?? [];
      return Array.isArray(arr) && arr[0] ? (arr[0].id ?? arr[0]._id ?? null) : null;
    } catch { return null; }
  };

  const openTable = async (table) => {
    let oid = extractOid(table);
    if (!oid) oid = await fetchOidForTable(table);
    if (oid) navigate(`/orden/${oid}`);
    else enqueueSnackbar("No se encontró orden activa para esta mesa", { variant: "warning" });
  };

  /* ── Mesas ── */
  const {
    data: rawTables = [], isLoading: tablesLoading, isError: tablesError, refetch: refetchTables,
  } = useQuery({
    queryKey: ["tablesHome"],
    queryFn: async () => {
      const r = await getTables();
      return Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : [];
    },
    refetchInterval: 10_000, refetchIntervalInBackground: 30_000,
    refetchOnWindowFocus: true, staleTime: 5_000,
  });

  const myTables = useMemo(() => {
    if (!rawTables?.length) return [];
    if (isAdmin) return rawTables;
    if (!waiterName) return [];
    return rawTables.filter((t) =>
      (t.waiter_name || t.name || "").trim().toLowerCase() === waiterName
    );
  }, [rawTables, isAdmin, waiterName]);

  const activeTables = useMemo(() => myTables.filter((t) => normalizeStatus(t?.status) === "ocupado"), [myTables]);

  /* ── Stats mesero (por DÍA) ── */
  const statsQ = useQuery({
    queryKey: ["waiterTodayStats", userData?.id],
    queryFn: async () => {
      const r = await axiosWrapper.get(`${API_URL}/api/waiter/today-stats?waiter_id=${userData.id}`);
      return r?.data?.data ?? { orders_count: 0, revenue: 0, kitchen_tips: 0, card_revenue: 0, cash_revenue: 0 };
    },
    enabled: (isWaiter || isAdmin) && !!userData?.id,
    refetchInterval: 30_000,
  });

  /* ── Turno (cajero/admin) ── */
  const turnoQ = useQuery({
    queryKey: ["turnoActual"],
    queryFn: async () => {
      const r = await axiosWrapper.get(`${API_URL}/api/turno-actual`);
      const d = r?.data?.data ?? {};
      return {
        turno_abierto: !!d.turno_abierto,
        total_ventas:  Number(d.total_ventas  ?? 0),
        total_ordenes: Number(d.total_ordenes ?? 0),
        hora_inicio:   d.hora_inicio ?? null,
      };
    },
    enabled: isCashier || isAdmin,
    retry: 1, refetchInterval: 45_000,
  });

  const iniciarM = useMutation({
    mutationFn: () => axiosWrapper.post(`${API_URL}/api/start`, {}, { withCredentials: true }),
    onSuccess: () => { turnoQ.refetch(); enqueueSnackbar("Turno iniciado", { variant: "success" }); },
    onError: (e) => enqueueSnackbar(`Error: ${e?.response?.data?.message || e.message}`, { variant: "error" }),
  });
  const cerrarM = useMutation({
    mutationFn: () => axiosWrapper.post(`${API_URL}/api/end`, {}, { withCredentials: true }),
    onSuccess: () => { turnoQ.refetch(); enqueueSnackbar("Turno cerrado", { variant: "success" }); },
    onError: (e) => enqueueSnackbar(`Error: ${e?.response?.data?.message || e.message}`, { variant: "error" }),
  });

  useEffect(() => { document.title = "Santa Clara | Panel"; }, []);

  /* ── Valores derivados del mesero ── */
  const rev   = Number(statsQ.data?.revenue      ?? 0);
  const tips  = Number(statsQ.data?.kitchen_tips ?? rev * 0.03);
  const card  = Number(statsQ.data?.card_revenue ?? 0);
  const cash  = Number(statsQ.data?.cash_revenue ?? 0);
  const ords  = Number(statsQ.data?.orders_count ?? 0);
  const loading = statsQ.isLoading;

  const showMesas = !isCashier || turnoQ.data?.turno_abierto;

  /* ── Hora de la orden ── */
  const orderTime = (t) => {
    const raw = t.order_date ?? t.created_at ?? t.order_time ?? null;
    if (!raw) return null;
    return new Date(raw).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-28">

      {/* ══ SALUDO COMPACTO ══ */}
      <motion.div
        className="px-5 py-4 flex items-center justify-between"
        style={{background: 'linear-gradient(to right, #111111, #1A1A1A)'}}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      >
        <div>
          <p className="text-gray-400 text-[11px] font-medium capitalize">
            {now.toLocaleDateString("es-NI", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-white text-lg font-bold leading-tight">
            {greeting}, <span className="text-amber-300">{userData?.name || "Usuario"}</span>
          </h1>
        </div>
        {activeTables.length > 0 && (
          <div className="bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
            {activeTables.length} mesa{activeTables.length !== 1 ? "s" : ""}
          </div>
        )}
      </motion.div>

      <main className="flex-1 px-4 pt-3 space-y-3">

        {/* ══ CAJERO/ADMIN: alertas de turno ══ */}
        {(isCashier || isAdmin) && (
          <>
            {(turnoQ.isError || (!turnoQ.data?.turno_abierto && !turnoQ.isLoading)) && (
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="font-bold text-red-700 text-sm">Sin turno activo</p>
                <p className="text-red-500 text-xs mt-0.5">{turnoQ.error?.message || "Inicia tu turno para comenzar."}</p>
                <button onClick={() => iniciarM.mutate()} disabled={iniciarM.isPending}
                  className="mt-2 bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-red-700 transition disabled:opacity-60">
                  <FaSignInAlt size={11} />
                  {iniciarM.isPending ? "Iniciando..." : "Iniciar Turno"}
                </button>
              </motion.div>
            )}
            {turnoQ.data?.turno_abierto && (
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex justify-end">
                <motion.button onClick={() => cerrarM.mutate()} disabled={cerrarM.isPending}
                  className="bg-red-600 text-white px-4 py-2.5 rounded-2xl shadow-md font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-60"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <FaSignOutAlt size={13} />
                  {cerrarM.isPending ? "Cerrando..." : "Cerrar Turno"}
                </motion.button>
              </motion.div>
            )}
          </>
        )}

        {/* ══ MESERO: stats del día ══ */}
        {isWaiter && !isCashier && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

            {/* Fila principal: total y órdenes */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Ganancias hoy</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-gray-400 text-xl font-bold">$</span>
                  <span className="text-gray-900 text-5xl font-black leading-none">
                    {loading ? <span className="text-gray-200 animate-pulse">—</span> : <Counter value={rev} decimals={2} />}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Órdenes</p>
                <p className="text-gray-900 text-4xl font-black mt-1">
                  {loading ? "—" : ords}
                </p>
              </div>
            </div>

            {/* Fila secundaria: propinas | efectivo | tarjeta */}
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="flex flex-col items-center py-4 px-3 gap-1">
                <GiCookingPot className="text-amber-500 text-xl mb-0.5" />
                <p className="text-xs text-gray-400 font-medium">Propinas</p>
                <p className="text-base font-bold text-amber-700">
                  {loading ? "—" : `$${tips.toFixed(2)}`}
                </p>
                <p className="text-[10px] text-gray-300">3% cocina</p>
              </div>
              <div className="flex flex-col items-center py-4 px-3 gap-1">
                <BsCashStack className="text-emerald-500 text-xl mb-0.5" />
                <p className="text-xs text-gray-400 font-medium">Efectivo</p>
                <p className="text-base font-bold text-emerald-700">
                  {loading ? "—" : `$${cash.toFixed(2)}`}
                </p>
              </div>
              <div className="flex flex-col items-center py-4 px-3 gap-1">
                <FaCreditCard className="text-blue-500 text-xl mb-0.5" />
                <p className="text-xs text-gray-400 font-medium">Tarjeta</p>
                <p className="text-base font-bold text-blue-700">
                  {loading ? "—" : `$${card.toFixed(2)}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ CAJERO/ADMIN: métricas de turno ══ */}
        {(isCashier || isAdmin) && (
          <motion.div className="grid grid-cols-2 gap-3" variants={stagger} initial="hidden" animate="visible">
            <motion.div custom={0} variants={fadeUp}
              className={`col-span-2 rounded-2xl p-4 text-white shadow-md ${
                turnoQ.data?.turno_abierto ? "bg-gradient-to-r from-gray-800 to-gray-700" : "bg-gray-500"
              }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/70 text-xs font-medium">Estado del Turno</p>
                  <p className="text-2xl font-black mt-0.5">
                    {turnoQ.isLoading ? "..." : turnoQ.data?.turno_abierto ? "Abierto" : "Cerrado"}
                  </p>
                  {turnoQ.data?.hora_inicio && (
                    <p className="text-white/60 text-xs mt-0.5">
                      Desde {new Date(turnoQ.data.hora_inicio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                <FiUser className="text-white/40 text-3xl" />
              </div>
            </motion.div>
            <motion.div custom={1} variants={fadeUp} className="bg-emerald-500 rounded-2xl p-4 text-white shadow-md">
              <p className="text-white/70 text-xs font-medium">Ventas Turno</p>
              <p className="text-2xl font-black mt-0.5">
                {turnoQ.isLoading ? "..." : `$${Number(turnoQ.data?.total_ventas ?? 0).toFixed(2)}`}
              </p>
            </motion.div>
            <motion.div custom={2} variants={fadeUp} className="bg-amber-500 rounded-2xl p-4 text-white shadow-md">
              <p className="text-white/70 text-xs font-medium">Órdenes</p>
              <p className="text-2xl font-black mt-0.5">
                {turnoQ.isLoading ? "..." : (turnoQ.data?.total_ordenes ?? 0)}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ══ MESAS ACTIVAS ══ */}
        {showMesas ? (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
              <div>
                <h2 className="text-sm font-bold text-gray-900">{isAdmin ? "Mesas Activas" : "Mis Mesas"}</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {activeTables.length === 0 ? "Sin mesas ocupadas" : `${activeTables.length} ocupada${activeTables.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <motion.button onClick={() => navigate("/orders")}
                className="flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 px-3 py-1.5 rounded-xl"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                Ver todas <FaArrowRight size={10} />
              </motion.button>
            </div>

            {tablesLoading ? (
              <div className="grid grid-cols-2 gap-3 p-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : tablesError ? (
              <p className="text-center py-8 text-red-500 text-sm">
                Error. <button onClick={refetchTables} className="underline">Reintentar</button>
              </p>
            ) : activeTables.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <GiCookingPot className="text-gray-300 text-4xl mb-2" />
                <p className="text-gray-400 text-sm font-medium">No hay mesas activas</p>
                <p className="text-gray-300 text-xs mt-0.5">Aparecerán al abrir órdenes</p>
              </div>
            ) : (
              <motion.div className="grid grid-cols-2 gap-3 p-3" variants={stagger} initial="hidden" animate="visible">
                {activeTables.map((table, i) => {
                  const total = Number(table.total_with_tax ?? table.total ?? 0);
                  const hora  = orderTime(table);

                  return (
                    <motion.div
                      key={table.id ?? table.table_no}
                      custom={i} variants={fadeUp}
                      onClick={() => openTable(table)}
                      className="relative bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-3.5 cursor-pointer shadow-md overflow-hidden"
                      whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    >
                      {/* badge número */}
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/20 text-white font-extrabold text-xs flex items-center justify-center">
                        {table.table_no ?? "?"}
                      </div>

                      <p className="text-orange-100 text-[10px] font-semibold">Mesa {table.table_no ?? "?"}</p>
                      <p className="text-white text-xl font-black leading-tight mt-0.5">
                        {total > 0 ? `$${total.toFixed(2)}` : "—"}
                      </p>

                      {isAdmin && table.waiter_name && (
                        <p className="text-orange-100 text-[10px] mt-1 truncate">{table.waiter_name}</p>
                      )}

                      {hora && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <FiClock className="text-orange-200 text-[10px]" />
                          <span className="text-orange-100 text-[10px] font-medium">{hora}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-bold text-amber-900 text-sm">Turno requerido</p>
            <p className="text-amber-700 text-xs mt-0.5">Inicia tu turno para ver mesas y tomar órdenes.</p>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
