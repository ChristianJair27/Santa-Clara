import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { HiPhoto } from "react-icons/hi2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDish, updateDish, getCategories } from "../../https";
import { enqueueSnackbar } from "notistack";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const AddDishModal = ({ setIsOpen, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({ name: "", price: "", category_id: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        price: initialData.price?.toString() || "",
        category_id: initialData.category_id || "",
      });
      if (initialData.image_path) {
        setPreview(`${BACKEND_URL}${initialData.image_path}`);
      }
    }
  }, [initialData, isEditing]);

  const { data: catResponse, isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categories = Array.isArray(catResponse?.data)
    ? catResponse.data
    : Array.isArray(catResponse?.data?.data)
    ? catResponse.data.data
    : [];

  const mutation = useMutation({
    mutationFn: (fd) =>
      isEditing ? updateDish(initialData.id, fd) : addDish(fd),
    onSuccess: () => {
      enqueueSnackbar(isEditing ? "Platillo actualizado" : "Platillo agregado", { variant: "success" });
      queryClient.invalidateQueries(["dishes"]);
      setIsOpen(false);
    },
    onError: (err) => {
      enqueueSnackbar(err?.data?.message || err?.message || "Error al guardar", { variant: "error" });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      enqueueSnackbar("Solo imágenes (jpg, png, webp)", { variant: "warning" });
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.category_id) {
      enqueueSnackbar("Completa los campos obligatorios", { variant: "warning" });
      return;
    }

    const fd = new FormData();
    fd.append("name", formData.name.trim());
    fd.append("price", formData.price);
    fd.append("category_id", formData.category_id);
    if (selectedFile) fd.append("image", selectedFile);

    mutation.mutate(fd);
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-[#1f1f1f] border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-sm";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[#262626] rounded-2xl shadow-2xl w-full max-w-md border border-white/5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {isEditing ? "Editar Platillo" : "Nuevo Platillo"}
          </h2>
          <button
            type="button"
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
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Torta de milanesa"
              className={inputClass}
              required
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Precio *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                className={`${inputClass} pl-8`}
                required
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Categoría *
            </label>
            {catLoading ? (
              <div className={`${inputClass} text-gray-500`}>Cargando...</div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-2.5 bg-[#1f1f1f] border border-red-900/40 rounded-xl text-red-400 text-sm">
                No hay categorías disponibles
              </div>
            ) : (
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`${inputClass} appearance-none cursor-pointer`}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Imagen del platillo
            </label>

            {/* Input real — oculto, controlado por ref */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {preview ? (
              /* Vista previa */
              <div className="relative rounded-xl overflow-hidden border border-white/8 bg-[#1a1a1a]">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="text-white text-xs font-semibold bg-black/60 px-4 py-2 rounded-lg border border-white/20">
                    Cambiar imagen
                  </span>
                </button>
              </div>
            ) : (
              /* Zona de carga */
              <button
                type="button"
                onClick={openFilePicker}
                className="w-full h-32 flex flex-col items-center justify-center bg-[#1f1f1f] border-2 border-dashed border-white/10 rounded-xl hover:border-green-500/40 hover:bg-[#222] transition-all group"
              >
                <HiPhoto size={28} className="text-gray-600 group-hover:text-green-500/60 mb-1.5 transition-colors" />
                <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                  Haz clic para subir imagen
                </span>
                <span className="text-xs text-gray-600 mt-0.5">JPG, PNG, WEBP · máx 5 MB</span>
              </button>
            )}

            {preview && (
              <button
                type="button"
                onClick={openFilePicker}
                className="mt-2 flex items-center gap-1.5 text-xs text-green-500/70 hover:text-green-400 transition-colors"
              >
                <HiPhoto size={13} />
                Cambiar imagen
              </button>
            )}

            {isEditing && initialData?.image_path && !selectedFile && (
              <p className="mt-1.5 text-xs text-gray-600">
                Se mantendrá la imagen actual si no subes una nueva
              </p>
            )}
          </div>

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
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-lg shadow-green-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Guardando..." : isEditing ? "Actualizar" : "Guardar Platillo"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddDishModal;
