import { useState } from "react";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { axiosWrapper } from "../../https/axiosWrapper";

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
};

const inputFocusStyle = {
  border: "1px solid rgba(212,144,10,0.6)",
  outline: "none",
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState({});

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const loginMutation = useMutation({
    mutationFn: (reqData) => login(reqData),
    onSuccess: async (res) => {
      try {
        const payload = res?.data?.data || res?.data || {};
        const token =
          payload?.token || payload?.accessToken ||
          res?.data?.token || res?.data?.accessToken;

        if (!token) {
          enqueueSnackbar("No se recibió token del servidor.", { variant: "error" });
          return;
        }

        localStorage.setItem("access_token", token);
        localStorage.removeItem("token");

        let user = payload?.user || res?.data?.user || null;
        if (!user) {
          const me = await axiosWrapper.get("/users/me");
          user = me?.data;
        }

        if (!user) {
          enqueueSnackbar("No se pudo obtener el perfil.", { variant: "warning" });
        } else {
          const { id, name, email, phone, role } = user;
          dispatch(setUser({ id, name, email, phone, role }));
        }

        enqueueSnackbar("Sesión iniciada", { variant: "success" });
        navigate("/", { replace: true });
      } catch (e) {
        enqueueSnackbar(e?.message || "Error al iniciar sesión", { variant: "error" });
      }
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Credenciales inválidas";
      enqueueSnackbar(msg, { variant: "error" });
    },
    onSettled: () => setIsLoading(false),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: "#9CA3AF" }}>
          Correo electrónico
        </label>
        <div className="relative">
          <FaEnvelope
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: "#6B7280" }}
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocused((f) => ({ ...f, email: true }))}
            onBlur={() => setFocused((f) => ({ ...f, email: false }))}
            placeholder="admin@santaclara.com"
            autoComplete="username"
            required
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl placeholder-gray-600 transition-all"
            style={focused.email ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: "#9CA3AF" }}>
          Contraseña
        </label>
        <div className="relative">
          <FaLock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: "#6B7280" }}
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setFocused((f) => ({ ...f, password: true }))}
            onBlur={() => setFocused((f) => ({ ...f, password: false }))}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl placeholder-gray-600 transition-all"
            style={focused.password ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm mt-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #D4900A, #B45309)", color: "#fff" }}
        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Verificando...
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </button>
    </form>
  );
};

export default Login;
