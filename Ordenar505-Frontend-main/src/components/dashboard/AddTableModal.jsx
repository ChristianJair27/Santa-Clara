import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";

const AddTableModal = ({ setIsOpen, onTableAdded, onUserAdded }) => {
  const [formData, setFormData] = useState({ table_no: "", seats: "" });
  const [isSaving, setIsSaving] = useState(false);

  const afterSave =
    typeof onTableAdded === "function"
      ? onTableAdded
      : typeof onUserAdded === "function"
      ? onUserAdded
      : () => {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    const clean = value.replace(/[^\d]/g, "");
    setFormData((prev) => ({ ...prev, [name]: clean }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const table_no = Number(formData.table_no);
    const seats = Number(formData.seats);

    if (!table_no || !seats) {
      enqueueSnackbar("Completa todos los campos con valores numéricos", { variant: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      await axiosWrapper.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/table/add`,
        { table_no, seats },
        { withCredentials: true }
      );
      enqueueSnackbar(`Mesa ${table_no} agregada correctamente`, { variant: "success" });
      afterSave();
      setIsOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Error al agregar mesa";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-[#1f1f1f] border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-sm text-center text-lg font-semibold tracking-widest";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[#262626] rounded-2xl shadow-2xl w-full max-w-sm border border-white/5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white tracking-tight">Nueva Mesa</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <IoMdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Número de mesa */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider text-center">
              Número de Mesa
            </label>
            <input
              type="text"
              name="table_no"
              placeholder="1"
              value={formData.table_no}
              onChange={handleChange}
              required
              inputMode="numeric"
              pattern="\d*"
              className={inputClass}
            />
          </div>

          {/* Asientos */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider text-center">
              Número de Asientos
            </label>
            <input
              type="text"
              name="seats"
              placeholder="4"
              value={formData.seats}
              onChange={handleChange}
              required
              inputMode="numeric"
              pattern="\d*"
              className={inputClass}
            />
          </div>

          {/* Preview */}
          {(formData.table_no || formData.seats) && (
            <div className="flex items-center justify-center gap-4 p-3 bg-[#1f1f1f] rounded-xl border border-white/5">
              {formData.table_no && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{formData.table_no}</p>
                  <p className="text-xs text-gray-500">Mesa</p>
                </div>
              )}
              {formData.table_no && formData.seats && (
                <div className="w-px h-8 bg-white/10" />
              )}
              {formData.seats && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{formData.seats}</p>
                  <p className="text-xs text-gray-500">Asientos</p>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-lg shadow-green-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Guardando..." : "Agregar Mesa"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTableModal;
