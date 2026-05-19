import PropTypes from "prop-types";
import { FaUserEdit, FaUtensils, FaReceipt, FaPrint, FaPlusCircle } from "react-icons/fa";
import { BsClockHistory, BsCheckCircleFill } from "react-icons/bs";
import { MdTableRestaurant } from "react-icons/md";
import { getAvatarName } from "../../utils/index";
import { useNavigate } from "react-router-dom";
import { formatDateAndTime } from "../../utils";
import { axiosWrapper } from "../../https/axiosWrapper";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const OrderCard = ({
  order,
  isCompleted = false,
  onInvoiceClick = () => {},
}) => {
  const navigate = useNavigate();
  const userData = useSelector((s) => s.user);
  const isAdmin  = String(userData?.role || "").toLowerCase() === "admin";

  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [waiters,         setWaiters]         = useState([]);
  const [selectedWaiter,  setSelectedWaiter]  = useState(null);

  const loadWaiters = async () => {
    try {
      let res = await axiosWrapper.get(`/api/user/users?role=waiter`);
      let arr = res?.data?.data || res?.data?.users || [];
      if (!arr.length) {
        res = await axiosWrapper.get(`/api/user?role=waiter`);
        arr = res?.data?.data || res?.data?.users || [];
      }
      setWaiters(arr);
    } catch (err) {
      enqueueSnackbar(`No pude cargar meseros. ${err?.response?.status || ""}`, { variant: "error" });
    }
  };

  const openChangeWaiter = async () => {
    setWaiterModalOpen(true);
    if (!waiters.length) await loadWaiters();
  };

  const assignWaiter = async () => {
    if (!selectedWaiter) { enqueueSnackbar("Selecciona un mesero.", { variant: "warning" }); return; }
    try {
      await axiosWrapper.put(`/api/order/${order.id}/assign-waiter`, { waiter_id: selectedWaiter });
      enqueueSnackbar("Mesero actualizado.", { variant: "success" });
      setWaiterModalOpen(false);
      window.location.reload();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || "Error al actualizar mesero.", { variant: "error" });
    }
  };

  /* ── Datos del order ── */
  const customerName = order.customerDetails?.name || order.name || order.customer_name || "Cliente";
  const avatarName   = getAvatarName(customerName);
  const orderDate    = order?.order_date || order?.created_at;
  const formattedDate = !orderDate || isNaN(new Date(orderDate))
    ? "—" : formatDateAndTime(orderDate);
  const tableNo      = String(order?.table_no || order?.table?.table_no || order?.table_id || "N/A");
  const orderId      = order.id ? String(order.id).slice(-6) : "N/A";

  let items = order?.items || [];
  if (typeof items === "string") { try { items = JSON.parse(items); } catch { items = []; } }
  const itemCount = Array.isArray(items) ? items.length : 0;

  const totalWithTax = Number(order.total_with_tax || order.totalWithTax || order.total || 0).toFixed(2);

  const status     = String(order.order_status || order.status || order.orderStatus || "").toLowerCase();
  const isReady    = status.includes("ready") || status.includes("listo");
  const isCanceled = status.includes("cancel");

  /* ── Impresión rápida ── */
  const handleQuickPrint = () => {
    let safeItems = order?.items || [];
    if (typeof safeItems === "string") { try { safeItems = JSON.parse(safeItems); } catch { safeItems = []; } }
    const dateStr = new Date(order?.order_date || Date.now()).toLocaleString();
    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Ticket</title>
<style>
@page{size:58mm auto;margin:0}
body{margin:0;padding:0;width:58mm;font-size:11px}
.r{width:58mm;box-sizing:border-box;padding:3mm 3mm 6mm}
h2,h3{text-align:center;margin:2mm 0 1mm;font-size:12px}
p{margin:0.5mm 0}.muted{color:#444;text-align:center}
.line{border-top:1px dashed #000;margin:2mm 0}
.row{display:flex;justify-content:space-between}
.items{list-style:none;padding:0;margin:0}
.item{display:flex;justify-content:space-between;margin:0.5mm 0}
</style></head><body><div class="r">
<h2>Santa Clara</h2><p class="muted">¡Gracias por su visita!</p>
<div class="line"></div>
<p><b>Orden:</b> #${order?.id??'N/A'}</p>
<p><b>Nombre:</b> ${order?.name||order?.customer_name||'N/A'}</p>
<p><b>Mesa:</b> ${tableNo}</p>
<p><b>Fecha:</b> ${dateStr}</p>
<div class="line"></div>
<ul class="items">${safeItems.map(it=>`<li class="item"><span>${it.item_name||it.name||'Artículo'}${it.quantity?` x${it.quantity}`:''}</span><span>$${Number(it.price??it.total??0).toFixed(2)}</span></li>`).join('')}</ul>
<div class="line"></div>
<div class="row"><b>Total:</b><b>$${Number(order?.total??order?.total_with_tax??0).toFixed(2)}</b></div>
<div class="line"></div>
<p class="muted">Método: ${order?.payment_method||'Pendiente'}</p>
</div><script>setTimeout(()=>{window.print();window.close();},50);</script></body></html>`;
    const w = window.open("", "_blank", "width=400,height=800");
    if (!w) return;
    w.document.open(); w.document.write(html); w.document.close();
  };

  const handleAddItems = () => {
    navigate(`/menu?mode=append&orderId=${order.id}`, {
      state: { mode: "append", orderId: order.id, lockRemoval: true },
      replace: false,
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">

        {/* ── Cabecera de la tarjeta ── */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 rounded-xl p-1.5">
              <FaUtensils className="text-white text-sm" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Orden #{orderId}</p>
              <p className="text-gray-300 text-[10px] mt-0.5">{formattedDate}</p>
            </div>
          </div>
          {/* Badge de estado */}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            isCanceled ? "bg-red-100 text-red-700"
            : isReady  ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
          }`}>
            {isCanceled ? "Cancelada" : isReady ? "Lista ✓" : "En prep."}
          </span>
        </div>

        {/* ── Cuerpo ── */}
        <div className="px-4 py-3 space-y-3">

          {/* Cliente + mesa + artículos */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
              {avatarName}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-semibold text-sm truncate">{customerName}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <MdTableRestaurant size={12} /> Mesa {tableNo}
                </span>
                <span>{itemCount} artículo{itemCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {/* Total */}
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 font-medium">Total</p>
              <p className="text-amber-700 font-black text-lg leading-none">${totalWithTax}</p>
            </div>
          </div>

          {/* Barra de estado */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            isReady    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : isCanceled ? "bg-red-50 text-red-600 border border-red-100"
            : "bg-amber-50 text-amber-700 border border-amber-100"
          }`}>
            {isReady
              ? <BsCheckCircleFill size={14} />
              : <BsClockHistory    size={14} />}
            {isReady    ? "Listo para servir"
            : isCanceled ? "Pedido cancelado"
            : "En preparación en cocina"}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!isCompleted && !isCanceled && (
              <button onClick={handleAddItems}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                <FaPlusCircle size={11} /> Agregar
              </button>
            )}
            {isAdmin && !isCompleted && !isCanceled && (
              <button onClick={openChangeWaiter}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                <FaUserEdit size={11} /> Mesero
              </button>
            )}
            <button onClick={handleQuickPrint}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
              <FaPrint size={11} /> Ticket
            </button>
            {!isCompleted ? (
              <button onClick={() => navigate(`/orden/${order.id}`)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition ml-auto">
                <FaReceipt size={11} /> Confirmar
              </button>
            ) : (
              <button onClick={() => onInvoiceClick(order)}
                className="flex items-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition ml-auto">
                <FaPrint size={11} /> Ver Orden
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Cambiar Mesero (solo admin) ── */}
      {waiterModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Cambiar mesero</h3>
            <p className="text-sm text-gray-500 mb-4">Selecciona el nuevo mesero para la orden #{orderId}.</p>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
              value={selectedWaiter || ""}
              onChange={(e) => setSelectedWaiter(Number(e.target.value))}
            >
              <option value="" disabled>Selecciona un mesero</option>
              {waiters.map((w) => (
                <option key={w.id} value={w.id}>{w.name || w.full_name || w.email || `ID ${w.id}`}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setWaiterModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={assignWaiter}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition">
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customerDetails: PropTypes.object,
    name: PropTypes.string,
    customer_name: PropTypes.string,
    order_date: PropTypes.string,
    created_at: PropTypes.string,
    table_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    table_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    table: PropTypes.shape({ table_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    items: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    total_with_tax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalWithTax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    order_status: PropTypes.string,
    status: PropTypes.string,
    orderStatus: PropTypes.string,
  }).isRequired,
  isCompleted: PropTypes.bool,
  onInvoiceClick: PropTypes.func,
};

export default OrderCard;
