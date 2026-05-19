import { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";

const Invoice = ({ orderInfo: order, setShowInvoice }) => {
  const invoiceRef = useRef(null);
  if (!order || !order.items || !order.total) return null;

  const buildPrintHTML = () => {
    const dateStr = new Date(order.order_date).toLocaleString();

    // OJO: aquí NO usamos Tailwind; todo es CSS propio del ticket
    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Santa Clara - Ticket</title>
  <style>
    /* Forzar tamaño exacto del rollo */
    @page { size: 58mm auto; margin: 0; }
html, body {
  margin: 0;
  padding: 0;
  width: 58mm;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.receipt {
  width: 58mm;
  box-sizing: border-box;
  padding: 3mm 3mm 6mm;
  font-size: 11px;
}
    h2, h3 {
      text-align: center;
      margin: 2mm 0 1mm;
      font-weight: 700;
      font-size: 12px;
    }
    p { margin: 0.5mm 0; }
    .muted { color: #444; text-align: center; }
    .line { border-top: 1px dashed #000; margin: 2mm 0; }
    .row { display: flex; justify-content: space-between; align-items: baseline; }
    .items { list-style: none; padding: 0; margin: 0; }
    .item { display: flex; justify-content: space-between; margin: 0.5mm 0; }
    .small { font-size: 10px; }
    .center { text-align: center; }
    .total .label { font-weight: 700; }
    .total .value { font-weight: 700; }
    /* Evitar cortes feos entre líneas */
    .receipt, .item, .row, h2, h3, p { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="receipt">
    <h2>Santa Clara</h2>
    <p class="muted">¡Gracias por su visita!</p>
    <div class="line"></div>

    <div>
      <p><strong>Orden ID:</strong> ${order.id}</p>
      <p><strong>Nombre:</strong> ${order.name || "N/A"}</p>
      <p><strong>Teléfono:</strong> ${order.phone || "N/A"}</p>
      <p><strong>Comensales:</strong> ${order.guests || "N/A"}</p>
      <p><strong>Mesa:</strong> ${order.table?.table_no || "N/A"}</p>
      <p><strong>Fecha:</strong> ${dateStr}</p>
    </div>

    <div class="line"></div>

    <h3 class="small">Platillos</h3>
    <ul class="items">
      ${order.items
        .map(
          (it) => `
        <li class="item small">
          <span>${it.item_name} x${it.quantity}</span>
          <span>$${(Number(it.price))}</span>
        </li>`
        )
        .join("")}
    </ul>

    <div class="line"></div>

    <p class="center small">* Los precios ya incluyen todos los cargos.</p>
    <div class="row total">
      <span class="label">Total:</span>
      <span class="value">$${Number(order.total).toFixed(2)}</span>
    </div>

    <div class="line"></div>

    <div class="center small">
      <p><strong>Método de pago:</strong> ${order.payment_method || "Pendiente"}</p>
      <p><strong>¡Vuelva pronto!</strong></p>
    </div>
  </div>
  <script>
    // Espera un frame para que el motor de layout calcule el tamaño exacto
    setTimeout(() => { window.print(); window.close(); }, 50);
  </script>
</body>
</html>
    `;
  };

  const handlePrint = () => {
    const printHTML = buildPrintHTML();
    const w = window.open("", "_blank", "width=400,height=800");
    w.document.open();
    w.document.write(printHTML);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[400px]">
        {/* Vista bonita en pantalla (Tailwind/Framer) */}
        <div ref={invoiceRef}>
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="w-12 h-12 border-8 border-green-500 rounded-full flex items-center justify-center shadow-lg bg-green-500"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-2xl text-white"
              >
                <FaCheck />
              </motion.span>
            </motion.div>
          </div>

          <h2 className="text-xl font-bold text-center mb-2">Santa Clara</h2>
          <p className="text-gray-600 text-center">¡Gracias por su visita!</p>
          <div className="border-t border-dashed my-3" />

          <div className="text-sm text-gray-700">
            <p><strong>Orden ID:</strong> {order.id}</p>
            <p><strong>Nombre:</strong> {order.name || "N/A"}</p>
            <p><strong>Teléfono:</strong> {order.phone || "N/A"}</p>
            <p><strong>Comensales:</strong> {order.guests || "N/A"}</p>
            <p><strong>Mesa:</strong> {order.table?.table_no || "N/A"}</p>
            <p><strong>Fecha:</strong> {new Date(order.order_date).toLocaleString()}</p>
          </div>

          <div className="border-t border-dashed my-3" />

          <div>
            <h3 className="text-sm font-semibold">Platillos</h3>
            <ul className="text-sm text-gray-700">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-xs">
                  <span>{item.item_name} x{item.quantity}</span>
                  <span>${(item.price)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-dashed my-3" />

          <p className="text-center mt-2 text-xs text-gray-500">
            * Los precios ya incluyen todos los cargos.
          </p>
          <div className="flex justify-between">
            <span className="font-bold">Total:</span>
            <span className="font-bold">${Number(order.total).toFixed(2)}</span>
          </div>

          <div className="border-t border-dashed my-3" />

          <div className="mb-2 text-xs text-center">
            <p><strong>Método de pago:</strong> {order.payment_method || "Pendiente"}</p>
            <p><strong>¡Vuelva pronto!</strong></p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-between mt-4">
          <button onClick={handlePrint} className="text-blue-500 hover:underline text-xs px-4 py-2 rounded-lg">
            Imprimir ticket
          </button>
          <button
            onClick={() => {
              setShowInvoice(false);
              window.location.reload();
            }}
            className="text-red-500 hover:underline text-xs px-4 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
