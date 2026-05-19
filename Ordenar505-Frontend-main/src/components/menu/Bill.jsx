import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice, removeAllItems, importItems } from "../../redux/slices/cartSlice";
import { addOrder } from "../../https/index";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../../https/index";
import * as http from "../../https/index";

const Bill = ({ mode, orderId, lockedTable = null, lockTableSelection = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.user);
  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const httpClient = http.api || http.client || http.axiosInstance || http.default || axios;

  const fetchOrderById = async (id) => {
    try {
      const r = await httpClient.get(`${API_URL}/api/orders/${id}`);
      return r?.data?.data ?? r?.data;
    } catch (e) {
      if (e?.response?.status !== 404) throw e;
    }
    try {
      const r2 = await httpClient.get(`${API_URL}/api/order/${id}`);
      return r2?.data?.data ?? r2?.data;
    } catch (e) {
      throw e;
    }
  };

  const normalizeItemsFromOrder = (order) => {
    let items = order?.items || [];
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }
    return (Array.isArray(items) ? items : []).map((it) => ({
      id: it.item_id ?? it.id ?? it._id ?? `${it.name}-${Number(it.price ?? it.total ?? 0)}`,
      name: it.item_name ?? it.name ?? "Artículo",
      quantity: Number(it.quantity ?? 1),
      price: Number(it.price ?? it.total ?? 0),
      notes: it.notes ?? "",
      __existing: true,
    }));
  };

  const appendItems = async ({ orderId, items }) => {
    try {
      return await httpClient.put(`${API_URL}/api/orders/${orderId}`, { op: "appendItems", items });
    } catch (e) {
      if (e?.response?.status !== 404) throw e;
    }
    return await httpClient.put(`${API_URL}/api/order/${orderId}`, { op: "appendItems", items });
  };

  const createOrderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (res) => {
      const newOrderId = res?.data?.data?.orderId;

      const normalized = {
        orderId: newOrderId,
        createdBy: {
          id: user?.id ?? user?._id ?? null,
          name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
          role: user?.role ?? "user",
        },
        paymentMethod: paymentMethod || "Pending",
        total,
        items: cartData,
        tableId: customerData?.table?.tableId ?? customerData?.table?.id ?? null,
      };

      setOrderInfo(normalized);
      enqueueSnackbar("¡Orden registrada correctamente!", { variant: "success" });

      dispatch(removeCustomer());
      dispatch(removeAllItems());

      logout();
      navigate("/profiles", { replace: true });
      // Mantenemos el reload aquí porque parece ser intencional para logout completo
      setTimeout(() => window.location.reload(), 150);
    },
    onError: (error) => {
      console.error("Error al crear orden:", error);
      enqueueSnackbar("No se pudo registrar la orden", { variant: "error" });
      setIsSubmitting(false);
    },
  });

  const appendItemsMutation = useMutation({
    mutationFn: ({ orderId, items }) => appendItems({ orderId, items }),
    onSuccess: async () => {
      enqueueSnackbar("¡Artículos agregados a la orden!", { variant: "success" });

      // Refrescamos la orden (opcional pero útil para consistencia)
      try {
        const fullOrder = await fetchOrderById(orderId);
        const normalized = normalizeItemsFromOrder(fullOrder);
        dispatch(removeAllItems());
        // dispatch(importItems(normalized));   // descomenta si quieres recargar el carrito inmediatamente
      } catch (e) {
        console.warn("No se pudo refrescar la orden después de append:", e);
      }

      // Navegación inteligente usando returnTo
      const returnTo = location.state?.returnTo || "/orders";
      navigate(returnTo, { replace: true });

      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error al agregar items:", error);
      enqueueSnackbar(
        error?.response?.data?.message ||
        error?.message ||
        "No se pudieron agregar los artículos a la orden",
        { variant: "error" }
      );
      setIsSubmitting(false);
    },
  });

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (cartData.length === 0) {
      enqueueSnackbar("El carrito está vacío", { variant: "warning" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "append" && orderId) {
        const newItems = cartData.filter((it) => !it.__existing);
        if (newItems.length === 0) {
          enqueueSnackbar("No hay artículos nuevos para agregar.", { variant: "info" });
          setIsSubmitting(false);
          return;
        }

        const itemsPayload = newItems.map((it) => ({
          id: it.id,
          name: it.name,
          quantity: Number(it.quantity ?? 1),
          price: Number(it.price ?? 0),
          notes: it.notes ?? "",
        }));

        appendItemsMutation.mutate({ orderId, items: itemsPayload });
        return;
      }

      // Flujo de creación de orden nueva
      const raw = customerData?.table;
      const tableIdFromStore = typeof raw === "object" ? (raw?.tableId ?? raw?.id) : raw;

      const tableId = parseInt(
        (lockTableSelection && lockedTable != null) ? lockedTable : tableIdFromStore,
        10
      );

      if (!tableId || Number.isNaN(tableId)) {
        enqueueSnackbar("No se ha seleccionado una mesa válida.", { variant: "error" });
        setIsSubmitting(false);
        return;
      }

      const orderData = {
        user_id: user?.id ?? user?._id ?? null,
        name: user?.name ?? user?.full_name ?? "Usuario",
        created_by_id: user?.id ?? user?._id ?? null,
        created_by_name: user?.name ?? user?.full_name ?? "Usuario",
        createdBy: {
          id: user?.id ?? user?._id ?? null,
          name: user?.name ?? user?.full_name ?? user?.username ?? "Usuario",
          role: user?.role ?? "user",
        },
        customerDetails: {
          name: user?.name ?? "Usuario",
          phone: "N/A",
          guests: customerData?.guests || 1,
        },
        orderStatus: "In Progress",
        bills: {
          total: total,
          tax: 0,
          totalWithTax: total,
        },
        items: cartData,
        table: tableId,
        paymentMethod: paymentMethod || "Pending",
      };

      createOrderMutation.mutate(orderData);
    } catch (err) {
      console.error("Error inesperado al procesar la orden:", err);
      enqueueSnackbar("Error inesperado al procesar la orden", { variant: "error" });
      setIsSubmitting(false);
    }
  };

  const isAppending = mode === "append" && !!orderId;

  return (
    <>
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Artículos ({cartData.length})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          ${total.toFixed(2)}
        </h1>
      </div>

      <div className="flex items-center gap-3 px-5 mt-4">
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || cartData.length === 0}
          className={`
            px-4 py-4 w-full rounded-xl text-white font-bold text-xl transition-all duration-300 flex items-center justify-center gap-4
            ${isSubmitting || cartData.length === 0
              ? "bg-gray-400 cursor-not-allowed opacity-70"
              : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-2xl transform hover:scale-105"
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent"></div>
              Procesando...
            </>
          ) : (
            <>{isAppending ? "Agregar a la orden" : "Tomar Orden"}</>
          )}
        </button>
      </div>

      {showInvoice && !isAppending && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;