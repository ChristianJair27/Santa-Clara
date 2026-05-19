import { useState } from "react";
import { register } from "../../https";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";

const ROLES = [
  { value: "Waiter",  label: "Mesero"  },
  { value: "Cashier", label: "Cajero"  },
  { value: "Admin",   label: "Admin"   },
];

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
};
const inputFocusStyle = { border: "1px solid rgba(212,144,10,0.6)" };

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: "#9CA3AF" }}>
      {label}
    </label>
    {children}
  </div>
);

const Register = ({ setIsRegister }) => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", role: "" });
  const [focused, setFocused] = useState({});

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const registerMutation = useMutation({
    mutationFn: (data) => register(data),
    onSuccess: (res) => {
      enqueueSnackbar(res?.data?.message || "Cuenta creada", { variant: "success" });
      setFormData({ name: "", email: "", phone: "", password: "", role: "" });
      setTimeout(() => setIsRegister(false), 1500);
    },
    onError: (err) => {
      enqueueSnackbar(err?.response?.data?.message || "Error al registrar", { variant: "error" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.role) { enqueueSnackbar("Selecciona un rol", { variant: "warning" }); return; }
    registerMutation.mutate(formData);
  };

  const inputProps = (name, type = "text", placeholder = "") => ({
    type,
    name,
    value: formData[name],
    onChange: handleChange,
    onFocus: () => setFocused((f) => ({ ...f, [name]: true })),
    onBlur: () => setFocused((f) => ({ ...f, [name]: false })),
    placeholder,
    required: true,
    className: "w-full px-4 py-2.5 text-sm rounded-xl placeholder-gray-600 transition-all outline-none",
    style: focused[name] ? { ...inputStyle, ...inputFocusStyle } : inputStyle,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      <Field label="Nombre completo">
        <input {...inputProps("name", "text", "Nombre del empleado")} />
      </Field>

      <Field label="Correo electrónico">
        <input {...inputProps("email", "email", "correo@empresa.com")} autoComplete="off" />
      </Field>

      <Field label="Teléfono">
        <input {...inputProps("phone", "tel", "+505 0000 0000")} />
      </Field>

      <Field label="Contraseña">
        <input {...inputProps("password", "password", "••••••••")} autoComplete="new-password" />
      </Field>

      <Field label="Rol">
        <div className="grid grid-cols-3 gap-2 mt-1">
          {ROLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormData((s) => ({ ...s, role: value }))}
              className="py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={
                formData.role === value
                  ? { background: "linear-gradient(135deg, #D4900A, #B45309)", color: "#fff", border: "1px solid transparent" }
                  : { background: "rgba(255,255,255,0.05)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.08)" }
              }
              onMouseEnter={(e) => {
                if (formData.role !== value) e.currentTarget.style.borderColor = "rgba(212,144,10,0.4)";
              }}
              onMouseLeave={(e) => {
                if (formData.role !== value) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full py-3 rounded-xl font-bold text-sm mt-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #D4900A, #B45309)", color: "#fff" }}
        onMouseEnter={(e) => { if (!registerMutation.isPending) e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        {registerMutation.isPending ? "Registrando..." : "Crear Cuenta"}
      </button>
    </form>
  );
};

export default Register;
