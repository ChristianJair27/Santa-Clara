import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaUtensils, FaUsers, FaPlus, FaMinus, FaPhone } from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";
import { motion } from "framer-motion";

const BottomNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();

  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [guestCount,     setGuestCount]     = useState(1);
  const [customerName,   setCustomerName]   = useState("");
  const [customerPhone,  setCustomerPhone]  = useState("");
  const modalRef = useRef(null);

  const HIDE_ON = ["/menu"];
  if (HIDE_ON.includes(location.pathname)) return null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) setIsModalOpen(false);
    };
    if (isModalOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  const openModal  = () => { setGuestCount(1); setCustomerName(""); setCustomerPhone(""); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const incrementGuest = () => {
    if (guestCount >= 10) { enqueueSnackbar("Máximo 10 comensales.", { variant: "info" }); return; }
    setGuestCount((p) => p + 1);
  };
  const decrementGuest = () => {
    if (guestCount <= 1) { enqueueSnackbar("Mínimo 1 comensal.", { variant: "info" }); return; }
    setGuestCount((p) => p - 1);
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/tables") return location.pathname.startsWith("/tables") || location.pathname.startsWith("/menu");
    return location.pathname.startsWith(path);
  };

  const handleCreateOrder = () => {
    if (!customerName.trim()) { enqueueSnackbar("Ingresa el nombre del cliente.", { variant: "error" }); return; }
    dispatch(setCustomer({ customerName, customerPhone, guests: guestCount }));
    navigate("/tables");
    closeModal();
    enqueueSnackbar("¡Cliente configurado! Selecciona una mesa.", { variant: "success" });
  };

  const centerDisabled = isActive("/tables") || isActive("/menu");

  return (
    <>
      {/* ── PILL FLOTANTE ── */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-gray-100/80 px-2 py-1.5 gap-1">

          {/* Inicio */}
          <motion.button
            onClick={() => navigate("/")}
            className={`flex flex-col items-center px-5 py-2 rounded-full transition-colors ${
              isActive("/") ? "bg-amber-50 text-amber-600" : "text-gray-400 hover:text-gray-600"
            }`}
            whileTap={{ scale: 0.93 }}
          >
            <FaHome size={18} />
            <span className="text-[10px] font-semibold mt-0.5">Inicio</span>
          </motion.button>

          {/* Botón central – ir a mesas */}
          <motion.button
            disabled={centerDisabled}
            onClick={() => navigate("/tables")}
            className={`w-14 h-14 -mt-5 rounded-full text-white flex items-center justify-center shadow-xl mx-1 transition-all ${
              centerDisabled ? "opacity-50 cursor-not-allowed grayscale" : ""
            }`}
            style={!centerDisabled ? {background: 'linear-gradient(135deg, #1A1A1A, #0D0D0D)'} : {}}
            whileHover={centerDisabled ? {} : { scale: 1.1 }}
            whileTap={centerDisabled ? {} : { scale: 0.93 }}
            aria-label="Nueva Orden"
          >
            <FaUtensils size={20} />
          </motion.button>

          {/* Órdenes */}
          <motion.button
            onClick={() => navigate("/orders")}
            className={`flex flex-col items-center px-5 py-2 rounded-full transition-colors ${
              isActive("/orders") ? "bg-amber-50 text-amber-600" : "text-gray-400 hover:text-gray-600"
            }`}
            whileTap={{ scale: 0.93 }}
          >
            <MdOutlineReceiptLong size={18} />
            <span className="text-[10px] font-semibold mt-0.5">Órdenes</span>
          </motion.button>
        </div>
      </nav>

      {/* Modal (por si se necesita en el futuro) */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nueva Orden" innerRef={modalRef}>
        <div className="space-y-5 p-4">
          <div>
            <label htmlFor="customerName" className="block text-gray-700 text-sm font-semibold mb-1.5">
              <FaUsers className="inline-block mr-1.5 text-amber-500" />
              Nombre del Cliente <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              type="text"
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-amber-400 focus:border-amber-400 text-gray-800 placeholder-gray-300 text-base shadow-sm transition-all"
              required autoFocus
            />
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-gray-700 text-sm font-semibold mb-1.5">
              <FaPhone className="inline-block mr-1.5 text-amber-500" />
              Teléfono (Opcional)
            </label>
            <input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              type="tel"
              placeholder="+505 8888 8888"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-amber-400 focus:border-amber-400 text-gray-800 placeholder-gray-300 text-base shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1.5">
              <FaUsers className="inline-block mr-1.5 text-amber-500" />
              Número de Comensales
            </label>
            <div className="flex items-center justify-between bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100">
              <button onClick={decrementGuest} disabled={guestCount <= 1}
                className="text-amber-600 hover:text-amber-800 text-2xl p-1.5 rounded-full hover:bg-amber-100 transition disabled:opacity-40">
                <FaMinus size={14} />
              </button>
              <span className="font-extrabold text-xl text-gray-900 w-10 text-center">{guestCount}</span>
              <button onClick={incrementGuest} disabled={guestCount >= 10}
                className="text-amber-600 hover:text-amber-800 text-2xl p-1.5 rounded-full hover:bg-amber-100 transition disabled:opacity-40">
                <FaPlus size={14} />
              </button>
            </div>
          </div>

          <button onClick={handleCreateOrder}
            className="w-full text-white rounded-xl py-3 font-bold text-base shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            style={{background: 'linear-gradient(to right, #1A1A1A, #0D0D0D)'}}>
            <FaUtensils size={15} />
            Crear Orden
          </button>
        </div>
      </Modal>
    </>
  );
};

export default BottomNav;
