import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaBell, FaUserCircle, FaChevronDown, FaStore } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { MdDashboard, MdPointOfSale } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/santa-clara-logo.png";
import { enqueueSnackbar } from "notistack";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Si tu endpoint /logout invalida cookies, puedes mantenerlo,
  // pero este flujo no depende de cookies. Haremos logout local sí o sí.
  const logoutMutation = useMutation({
    mutationFn: () => logout(), // si no tienes endpoint, puedes quitar esta línea y el hook
    onSettled: () => {
      // ✅ Limpia AMBAS claves por compatibilidad
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");

      dispatch(removeUser());
      setIsDropdownOpen(false);

      // ✅ Ir al login tipo Netflix (no /auth)
      navigate("/profiles", { replace: true });
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Aun con error del backend, hacemos logout local
      // (por si acaso ya lo hace onSettled, pero lo dejamos explícito)
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      dispatch(removeUser());
      setIsDropdownOpen(false);
      navigate("/profiles", { replace: true });
    },
  });

  const handleLogout = () => {
    // Si NO tienes endpoint /logout, comenta la siguiente línea y haz el logout local directamente:
    logoutMutation.mutate();

    // --- Logout local directo (si no usas endpoint) ---
    // localStorage.removeItem("access_token");
    // localStorage.removeItem("token");
    // dispatch(removeUser());
    // setIsDropdownOpen(false);
    // navigate("/profiles", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-carbon-800 shadow-xl border-b border-gray-900/80" style={{background: 'linear-gradient(to right, #111111, #1A1A1A)'}}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          <div onClick={() => navigate("/")} className="flex items-center gap-3 cursor-pointer group">
            <img src={logo} className="h-24 w-auto group-hover:scale-105 transition-transform duration-200" alt="Logo" />
            <span className="text-white text-2xl font-extrabold tracking-tight group-hover:text-amber-200 transition-colors hidden sm:block"></span>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            {userData.role === "admin" && (
              <button
                onClick={() => navigate("/dashboard")}
                className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/15 transition-colors duration-200 shadow-md flex items-center justify-center group"
                title="Panel de Administración"
                aria-label="Ir al Panel de Administración"
              >
                <MdDashboard className="text-2xl group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline ml-2 text-base font-semibold">Dashboard</span>
              </button>
            )}

            {userData.role === "cajero" && (
              <button
                onClick={() => navigate("/cashier-dashboard")}
                className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/15 transition-colors duration-200 shadow-md flex items-center justify-center group"
                title="Mi Caja"
                aria-label="Ir a Mi Caja"
              >
                <MdPointOfSale className="text-2xl group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline ml-2 text-base font-semibold">Mi Caja</span>
              </button>
            )}

            <button
              className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/15 relative transition-colors duration-200 shadow-md flex items-center justify-center group"
              title="Notificaciones"
              aria-label="Ver Notificaciones"
            >
              <FaBell className="text-2xl group-hover:scale-110 transition-transform" />
              <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-gray-900 animate-pulse"></span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <IoLogOut className="text-xl group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm lg:text-base">Salir</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                ref={userButtonRef}
                className="flex items-center space-x-2 p-2 pr-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-md"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <FaUserCircle className="text-3xl text-amber-300" />
                <div className="ml-2 text-left hidden lg:block">
                  <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                    {userData.name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {userData.role || "Rol"}
                  </p>
                </div>
                <FaChevronDown className={`text-amber-300 ml-2 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : "rotate-0"}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200 animate-dropdown-fade-in origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-100 mb-2">
                    <p className="text-sm font-semibold text-gray-800">{userData.name || "Usuario"}</p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{userData.role || "Rol"}</p>
                  </div>

                  {userData.role === "admin" && (
                    <button
                      onClick={() => { navigate("/dashboard"); setIsDropdownOpen(false); }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 w-full text-left transition-colors"
                    >
                      <MdDashboard className="mr-3 text-lg" />
                      Panel de Administración
                    </button>
                  )}

                  {userData.role === "cajero" && (
                    <button
                      onClick={() => { navigate("/cashier-dashboard"); setIsDropdownOpen(false); }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 w-full text-left transition-colors"
                    >
                      <MdPointOfSale className="mr-3 text-lg" />
                      Mi Caja
                    </button>
                  )}

                  <button
                    onClick={() => { setIsDropdownOpen(false); }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 w-full text-left transition-colors"
                  >
                    <FaUserCircle className="mr-3 text-lg" />
                    Mi Perfil
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
                  >
                    <IoLogOut className="mr-3 text-lg" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(-5px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dropdown-fade-in { animation: dropdownFadeIn 0.2s ease-out forwards; }
      `}</style>
    </header>
  );
};

export default Header;