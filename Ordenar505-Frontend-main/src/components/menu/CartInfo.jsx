import React, { useEffect, useRef, useMemo } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaShoppingCart, FaUtensils } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { removeItem } from "../../redux/slices/cartSlice";

const CartInfo = ({ lockRemoval = false, lockedTable = null }) => {
  const cartData = useSelector((state) => state.cart);
  const customerData = useSelector((state) => state.customer);
  const scrollRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [cartData]);

  const handleRemove = (itemId, itemName) => {
    if (lockRemoval) return;
    if (window.confirm(`¿Eliminar "${itemName}" del pedido?`)) {
      dispatch(removeItem(itemId));
    }
  };

  // ✅ SOLO usa item.price (total ya calculado en la DB)
  const subtotal = useMemo(() => {
    return cartData.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [cartData]);

  const total = subtotal;

  // ✅ Prefiere mesa bloqueada si viene por props
  const tableShown =
    (lockedTable !== null && lockedTable !== undefined)
      ? lockedTable
      : (
          customerData?.table?.tableNo ??
          customerData?.table?.tableNumber ??
          customerData?.table?.tableId ??
          "N/A"
        );

  return (
    <div className="bg-white rounded-xl shadow-2xl h-full flex flex-col border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-5 rounded-t-xl shadow-md flex items-center justify-between">
        <div className="flex items-center">
          <FaShoppingCart className="text-white text-2xl mr-3" />
          <h1 className="text-2xl font-bold text-white">Tu Pedido</h1>
        </div>
        <span className="text-blue-100 text-lg font-semibold">Mesa #{tableShown}</span>
      </div>

      {/* Resumen */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-gray-700">
        <span className="text-sm font-medium">
          <span className="font-bold text-blue-600">{cartData.length}</span>{" "}
          {cartData.length === 1 ? "artículo" : "artículos"} en el carrito
        </span>
        {lockRemoval && (
          <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Modo agregar (no se puede quitar)
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide" ref={scrollRef}>
        {cartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-blue-100 rounded-full p-5 mb-4 shadow-inner">
              <FaUtensils className="text-blue-500 text-4xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Tu carrito está vacío!</h3>
            <p className="text-gray-600 text-base">
              Agrega platillos de nuestro delicioso menú para comenzar tu pedido.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-3">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                      {item.name}
                    </h3>
                    {/* 🔄 Quitamos el “c/u”. Dejamos cantidad sola si quieres verla */}
                    {item.quantity != null && (
                      <p className="text-sm text-gray-600 mt-1">
                        Cantidad: <span className="font-medium">{item.quantity}</span>
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                        Notas: {item.notes}
                      </p>
                    )}
                  </div>
                  {/* ✅ Mostrar SOLO el total recibido (item.price) */}
                  <span className="font-bold text-xl text-blue-600 whitespace-nowrap">
                    ${Number(item.price || 0).toFixed(2)}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                  {!lockRemoval && (
                    <button
                      onClick={() => handleRemove(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                      aria-label={`Eliminar ${item.name}`}
                      title="Eliminar del pedido"
                    >
                      <RiDeleteBin6Line className="text-base" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 shadow-inner">
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-xl font-bold border-t border-dashed border-gray-300 pt-3">
            <span className="text-gray-900">Total del Pedido:</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CartInfo;
