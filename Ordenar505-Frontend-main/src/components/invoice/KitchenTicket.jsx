import React, { forwardRef } from "react";

const KitchenTicket = forwardRef(({ order }, ref) => {
  if (!order) return <p>No hay datos para imprimir</p>;

  return (
    <div ref={ref}>
      <h2>🧾 Ticket de Cocina</h2>
      {order?.items?.map((item, index) => (
        <div key={index}>
          <span>{item.item_name}</span> x{item.quantity}
        </div>
      ))}
    </div>
  );
});

KitchenTicket.displayName = "KitchenTicket";

export default KitchenTicket;