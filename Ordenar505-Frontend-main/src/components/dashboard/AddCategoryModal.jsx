import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCategory, updateCategory } from "../../https";
import { enqueueSnackbar } from "notistack";

const EMOJI_SUGGESTIONS = ["🍕", "🍔", "🌮", "🍜", "🥗", "🍣", "🥩", "🍰", "🥤", "🍺"];

const AddCategoryModal = ({ setIsOpen, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    bg_color: "#16a34a",
    icon: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        bg_color: initialData.bg_color || "#16a34a",
        icon: initialData.icon || "",
      });
    }
  }, [initialData, isEditing]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing ? updateCategory(initialData.id, data) : addCategory(data),
    onSuccess: (res) => {
      enqueueSnackbar(res.data?.message || (isEditing ? "Categoría actualizada" : "Categoría creada"), {
        variant: "success",
      });
      queryClient.invalidateQueries(["categories"]);
      setIsOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || "Error al guardar", { variant: "error" });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.icon) {
      enqueueSnackbar("Completa todos los campos", { variant: "warning" });
      return;
    }
    mutation.mutate(formData);
  };

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
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
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
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Nombre *
            </label>
            <input
              name="name"
              placeholder="Ej: Entradas, Bebidas..."
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#1f1f1f] border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-sm"
              required
            />
          </div>

          {/* Emoji / Icono */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Emoji / Icono *
            </label>
            <input
              name="icon"
              placeholder="Escribe o pega un emoji"
              value={formData.icon}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#1f1f1f] border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-sm text-center text-xl"
            />
            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap gap-2 mt-2">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, icon: emoji }))}
                  className={`text-lg px-2 py-1 rounded-lg transition-all hover:bg-white/10 ${
                    formData.icon === emoji ? "bg-white/15 ring-1 ring-green-500/50" : "bg-white/5"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color de fondo */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Color de fondo
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0"
                style={{ backgroundColor: formData.bg_color }}
              />
              <input
                type="color"
                name="bg_color"
                value={formData.bg_color}
                onChange={handleChange}
                className="flex-1 h-10 bg-[#1f1f1f] border border-white/8 rounded-xl cursor-pointer p-1"
              />
              <span className="text-xs text-gray-500 font-mono">{formData.bg_color}</span>
            </div>
          </div>

          {/* Preview */}
          {formData.name && formData.icon && (
            <div className="flex items-center gap-3 p-3 bg-[#1f1f1f] rounded-xl border border-white/5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: formData.bg_color + "33" }}
              >
                {formData.icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{formData.name}</p>
                <p className="text-gray-500 text-xs">Vista previa</p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-lg shadow-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Guardando..." : isEditing ? "Actualizar" : "Crear Categoría"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddCategoryModal;
