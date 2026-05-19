import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";

const ROLES = [
  { value: "waiter", label: "Mesero" },
  { value: "admin", label: "Administrador" },
  { value: "cajero", label: "Cajero" },
];

const AddUserModal = ({ setIsOpen, onUserAdded, initialData = null }) => {
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "waiter",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        password: "",
        role: initialData.role || "waiter",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      enqueueSnackbar("Faltan campos obligatorios", { variant: "warning" });
      return;
    }
    if (!isEditing && !formData.password) {
      enqueueSnackbar("La contraseña es obligatoria al crear usuario", { variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const url = import.meta.env.VITE_BACKEND_URL;
      const config = { withCredentials: true };

      if (isEditing) {
        const dataToSend = { ...formData };
        if (!dataToSend.password) delete dataToSend.password;
        await axiosWrapper.put(`${url}/api/user/${initialData.id}`, dataToSend, config);
        enqueueSnackbar("Usuario actualizado correctamente", { variant: "success" });
      } else {
        await axiosWrapper.post(`${url}/api/user/register`, formData, config);
        enqueueSnackbar("Usuario creado correctamente", { variant: "success" });
      }

      onUserAdded?.();
      setIsOpen(false);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (isEditing ? "No se pudo actualizar el usuario" : "No se pudo crear el usuario");
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-[#1f1f1f] border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[#262626] rounded-2xl shadow-2xl w-full max-w-md border border-white/5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <IoMdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre completo"
              required
              className={inputClass}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Correo electrónico *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
              className={inputClass}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className={labelClass}>
              {isEditing ? "Nueva contraseña (opcional)" : "Contraseña *"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditing}
              placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
              className={inputClass}
            />
          </div>

          {/* Rol */}
          <div>
            <label className={labelClass}>Rol *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer appearance-none`}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-lg shadow-green-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                  />
                </svg>
              )}
              {isEditing ? "Guardar cambios" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddUserModal;
