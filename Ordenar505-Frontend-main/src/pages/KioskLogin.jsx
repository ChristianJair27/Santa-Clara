// src/pages/KioskLogin.jsx
import { useEffect, useState } from "react";
import { axiosWrapper } from "../https/axiosWrapper";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/userSlice";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSearch, FaSyncAlt, FaLock } from "react-icons/fa";
import logo from "../assets/images/santa-clara-logo.png";

const initials = (name = "") => {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
};

export default function KioskLogin() {
  const [waiters, setWaiters] = useState([]);
  const [filteredWaiters, setFilteredWaiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWaiters(waiters);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredWaiters(
        waiters.filter((w) =>
          w.name.toLowerCase().includes(term) ||
          (w.role && w.role.toLowerCase().includes(term))
        )
      );
    }
  }, [waiters, searchTerm]);

  const fetchWaiters = async (showLoading = true) => {
    if (showLoading) setRefreshing(true);
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axiosWrapper.get(`${API}/api/auth/kiosk/waiters`);
      setWaiters(data?.data || []);
    } catch {
      enqueueSnackbar("No se pudo cargar la lista de meseros", { variant: "error" });
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = "Santa Clara | Perfiles";
    fetchWaiters(false);
  }, []);

  const enterAs = async (w) => {
    if (loading) return;
    setLoading(true);
    setLoadingId(w.id);
    try {
      const API = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axiosWrapper.post(`${API}/api/auth/kiosk/waiter-login`, {
        user_id: w.id,
      });
      const { token, user } = data?.data || {};
      if (!token || !user) throw new Error("Respuesta inválida");
      localStorage.setItem("access_token", token);
      dispatch(setUser(user));
      enqueueSnackbar(`¡Bienvenido, ${user.name}!`, { variant: "success" });
      navigate("/", { replace: true });
    } catch {
      enqueueSnackbar("No se pudo iniciar sesión", { variant: "error" });
    } finally {
      setLoading(false);
      setLoadingId(null);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #2A1F08 0%, #111111 40%, #0D0D0D 100%)" }}
    >
      {/* Ambient glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(212,144,10,0.12) 0%, transparent 70%)" }}
      />

      {/* Ambient glow bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(212,144,10,0.06) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-3xl z-10 flex flex-col items-center gap-8">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="rounded-full p-1 shadow-2xl"
            style={{ boxShadow: "0 0 40px rgba(212,144,10,0.25), 0 0 80px rgba(212,144,10,0.08)" }}
          >
            <img
              src={logo}
              alt="Santa Clara"
              className="h-36 w-36 rounded-full object-cover"
            />
          </div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#D4900A" }}>
            Sistema de Punto de Venta
          </p>
        </div>

        {/* ── Card principal ── */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,144,10,0.2)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{
              background: "rgba(212,144,10,0.07)",
              borderBottom: "1px solid rgba(212,144,10,0.15)",
            }}
          >
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">¿Quién toma la orden?</h2>
              <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                Selecciona tu perfil para comenzar
              </p>
            </div>

            {/* Buscador + refresh */}
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <FaSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                  style={{ color: "#6B7280" }}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm rounded-xl text-white placeholder-gray-500 outline-none focus:ring-1 w-40 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    focusRing: "#D4900A",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,144,10,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
              <button
                onClick={() => fetchWaiters()}
                disabled={refreshing}
                className="p-2 rounded-xl transition-colors disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#D4900A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                title="Actualizar"
              >
                <FaSyncAlt className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Buscador mobile */}
          <div className="sm:hidden px-6 pt-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "#6B7280" }} />
              <input
                type="text"
                placeholder="Buscar mesero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
          </div>

          {/* Grid de perfiles */}
          <div className="p-6">
            {filteredWaiters.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <FaUserCircle className="text-3xl" style={{ color: "#4B5563" }} />
                </div>
                <p className="text-gray-400 text-sm">
                  {searchTerm ? "No se encontraron meseros" : "No hay meseros disponibles"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
                    style={{ color: "#D4900A", border: "1px solid rgba(212,144,10,0.3)" }}
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredWaiters.map((w) => {
                  const isThisLoading = loadingId === w.id;
                  return (
                    <button
                      key={w.id}
                      disabled={loading}
                      onClick={() => enterAs(w)}
                      className="group relative rounded-xl overflow-hidden transition-all duration-200 disabled:opacity-60"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.border = "1px solid rgba(212,144,10,0.4)";
                          e.currentTarget.style.background = "rgba(212,144,10,0.06)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Avatar area */}
                      <div
                        className="aspect-square w-full flex items-center justify-center relative"
                        style={{ background: "rgba(0,0,0,0.2)" }}
                      >
                        {w.avatar_url ? (
                          <img
                            src={w.avatar_url}
                            alt={w.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
                            style={{ background: "linear-gradient(135deg, #D4900A, #92400E)" }}
                          >
                            {initials(w.name)}
                          </div>
                        )}

                        {/* Loading overlay */}
                        {isThisLoading && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
                            <div
                              className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                              style={{ borderColor: "#D4900A", borderTopColor: "transparent" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="px-3 py-2.5 text-center">
                        <p className="text-sm font-semibold text-white truncate">{w.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#D4900A" }}>
                          {w.role === "waiter" ? "Mesero" : w.role}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredWaiters.length > 0 && (
              <p className="text-center text-xs mt-5" style={{ color: "#4B5563" }}>
                ¿No ves tu perfil? Pídele al administrador que te habilite.
              </p>
            )}
          </div>
        </div>

        {/* ── Botón Admin ── */}
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(212,144,10,0.25)",
            color: "#D4900A",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(212,144,10,0.08)";
            e.currentTarget.style.borderColor = "rgba(212,144,10,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(212,144,10,0.25)";
          }}
        >
          <FaLock className="text-xs" />
          Ingresar como Administrador
        </button>

        {/* Footer */}
        <p className="text-xs" style={{ color: "#374151" }}>
          © {new Date().getFullYear()} Design by Revolution505
        </p>
      </div>
    </div>
  );
}
