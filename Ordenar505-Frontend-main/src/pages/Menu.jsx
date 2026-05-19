import React, { useEffect, useState, useRef, useMemo } from "react";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu, MdTableRestaurant, MdShoppingCart } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import { FaPlus, FaMinus, FaShoppingCart as FaCart } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";

import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";

import { useSelector, useDispatch } from "react-redux";
import { setCustomer } from "../redux/slices/customerSlice";
import { removeAllItems, importItems, addItems } from "../redux/slices/cartSlice";

const Menu = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = "Santa Clara | Menú";
  }, []);

  const mode = location.state?.mode || searchParams.get("mode");
  const orderId = location.state?.orderId || searchParams.get("orderId");
  const lockRemoval = location.state?.lockRemoval === true || searchParams.get("lockRemoval") === "true";

  const user = useSelector((state) => state.user);
  const customerData = useSelector((state) => state.customer);
  const cartItems = useSelector((state) => state.cart.items) || [];

  const [lockedTable, setLockedTable] = useState(null);

  useEffect(() => {
    if (mode === "append") {
      try { localStorage.removeItem("selectedTable"); } catch {}
      try { sessionStorage.removeItem("selectedTable"); } catch {}
    }
  }, [mode]);

  const creatorName = user?.name ?? user?.full_name ?? user?.username ?? "Usuario";

  const tableShown =
    mode === "append" && lockedTable != null
      ? lockedTable
      : customerData?.table?.tableNo ??
        customerData?.table?.tableNumber ??
        customerData?.table?.tableId ??
        "N/A";

  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [cartItems]
  );

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const prevOrderIdRef = useRef(null);

  useEffect(() => {
    if (mode !== "append" || !orderId) {
      dispatch(removeAllItems());
      prevOrderIdRef.current = null;
      setLockedTable(null);
    }
  }, [mode, orderId]);

  useEffect(() => {
    if (mode === "append" && orderId) {
      const curr = String(orderId);
      const prev = prevOrderIdRef.current;
      if (prev && prev !== curr) {
        dispatch(removeAllItems());
        setLockedTable(null);
      }
      prevOrderIdRef.current = curr;
    }
  }, [mode, orderId]);

  useEffect(() => {
    const hydrateFromOrder = async () => {
      if (mode !== "append" || !orderId) return;
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${orderId}`);
        const order = data?.data || data || {};

        const table_no =
          order?.table?.table_no ?? order?.table_no ?? order?.table_id ?? null;

        setLockedTable(table_no);

        dispatch(
          setCustomer({
            ...customerData,
            name: order?.name || order?.customer_name || customerData?.name || "",
            phone: order?.phone || customerData?.phone || "",
            guests: order?.guests || customerData?.guests || 1,
            table: { tableNo: table_no, tableId: table_no, tableNumber: table_no },
            orderId: order?.id,
          })
        );

        let items = order?.items || [];
        if (typeof items === "string") {
          try { items = JSON.parse(items); } catch { items = []; }
        }

        const normalized = (Array.isArray(items) ? items : []).map((it) => ({
          id: it.item_id ?? it.id ?? it._id ?? `${it.name}-${it.price}`,
          name: it.item_name ?? it.name ?? "Artículo",
          quantity: Number(it.quantity ?? 1),
          price: Number(it.price ?? it.total ?? 0),
          categoryId: it.category_id ?? it.categoryId ?? null,
          notes: it.notes ?? "",
          __existing: true,
        }));

        dispatch(removeAllItems());
        dispatch(importItems(normalized));
      } catch (err) {
        console.error("Error hidratando orden:", err);
      }
    };

    hydrateFromOrder();
  }, [mode, orderId, API_URL]);

  useEffect(() => {
    if (mode !== "append") return;
    if (lockedTable == null) return;

    const current =
      customerData?.table?.tableNo ??
      customerData?.table?.tableNumber ??
      customerData?.table?.tableId ??
      null;

    if (current !== lockedTable) {
      dispatch(
        setCustomer({
          ...customerData,
          table: { tableNo: lockedTable, tableId: lockedTable, tableNumber: lockedTable },
        })
      );
    }
  }, [mode, lockedTable, customerData?.table, dispatch]);

  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [itemCounts, setItemCounts] = useState({});
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [query, setQuery] = useState("");

  const fetchMenuData = async () => {
    setLoadingMenu(true);
    try {
      const [catRes, dishRes] = await Promise.all([
        axios.get(`${API_URL}/api/categories`),
        axios.get(`${API_URL}/api/dishes`),
      ]);

      const cats = catRes?.data?.data ?? [];
      const ds = dishRes?.data?.data ?? [];

      setCategories(cats);
      setDishes(ds);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0]);
      }

      const initialCounts = {};
      ds.forEach((dish) => { initialCounts[dish.id] = 0; });
      setItemCounts(initialCounts);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const increment = (id) => {
    setItemCounts((prev) => ({
      ...prev,
      [id]: Math.min((prev[id] || 0) + 1, 99),
    }));
  };

  const decrement = (id) => {
    setItemCounts((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));
  };

  const dishesForView = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return dishes.filter((d) =>
        String(d.name || "").toLowerCase().includes(q) ||
        String(d.description || "").toLowerCase().includes(q)
      );
    }
    if (selectedCategory?.id) {
      return dishes.filter((d) => d.category_id === selectedCategory.id);
    }
    return dishes;
  }, [dishes, selectedCategory, query]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTarget, setNoteTarget] = useState(null);

  const openNotesForItem = (item) => {
    const count = itemCounts[item.id] || 0;
    if (!count) return;
    setNoteTarget({ item, count });
    setNoteText("");
    setNoteOpen(true);
  };

  const uid = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const confirmAddWithNotes = () => {
    if (!noteTarget) return;
    const { item, count } = noteTarget;

    const newItem = {
      id: uid(),
      name: item.name,
      quantity: count,
      pricePerQuantity: Number(item.price),
      price: Number(item.price) * count,
      dishId: item.id,
      categoryId: item.category_id ?? null,
      notes: noteText.trim(),
    };

    dispatch(addItems(newItem));
    setItemCounts((prev) => ({ ...prev, [item.id]: 0 }));
    setNoteTarget(null);
    setNoteText("");
    setNoteOpen(false);
  };

  const leftPadBottom = totalCartItems > 0 ? "pb-32" : "pb-8";

  return (
    <div className="flex flex-col min-h-dvh bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
              <p className="text-sm text-gray-600">Toma el pedido rápidamente</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl px-4 py-3 border border-amber-200">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                <MdRestaurantMenu className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <FiUser className="text-gray-600" />
                  <span className="font-semibold text-gray-800">{creatorName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MdTableRestaurant className="text-gray-600" />
                  <span className="font-medium text-gray-700">Mesa {tableShown}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow lg:hidden"
              aria-label="Abrir carrito"
            >
              <MdShoppingCart className="text-2xl" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Menu */}
        <section className={`flex-1 overflow-y-auto ${leftPadBottom} bg-gray-100`}>
         {/* Search Bar + Barra de categorías fija */}
          <div className="sticky top-0 z-40 bg-gray-100">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar platillo..."
                  className="w-full pl-12 pr-5 py-4 bg-white rounded-2xl shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* BARRA DE CATEGORÍAS FIJA - SCROLL SUAVE Y VISIBLE */}
          <div className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-200">
            <div className="relative">
              <div className="px-4 py-5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                <div className="flex gap-4 min-w-max pb-2">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex-shrink-0 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 whitespace-nowrap shadow-md ${
                          selectedCategory?.id === category.id
                            ? "text-white scale-105 shadow-xl"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-lg"
                        }`}
                        style={selectedCategory?.id === category.id ? {background: 'linear-gradient(to right, #1A1A1A, #0D0D0D)'} : {}}
                      >
                        {category.name}
                        <span className="ml-3 text-sm font-medium opacity-90">
                          ({dishes.filter((d) => d.category_id === category.id).length})
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-gray-500 py-4 px-8">Cargando categorías...</div>
                  )}
                </div>
              </div>

              {/* Indicadores de scroll (opcional pero bonito) */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
            </div>
          </div>
          </div>

          {/* Dishes */}
          <div className="px-4 pb-8 pt-6">
            {loadingMenu ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-600"></div>
              </div>
            ) : dishesForView.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl text-gray-500 font-medium">No se encontraron platillos</p>
                <p className="text-gray-400 mt-2">Prueba buscando otro término o seleccionando una categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dishesForView.map((item) => {
                  const count = itemCounts[item.id] || 0;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col"
                    >
                      <div className="p-6 flex flex-col flex-1">
                        {query.trim() && (
                          <span className="text-xs text-amber-600 font-medium mb-2">
                            {categoryNameById.get(item.category_id) || "Sin categoría"}
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                            {item.name}
                          </h3>
                          <span className="text-2xl font-bold text-amber-700 whitespace-nowrap">
                            ${Number(item.price || 0).toFixed(2)}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-4">
                          <div className="flex items-center bg-gray-100 rounded-full overflow-hidden flex-1">
                            <button
                              onClick={() => decrement(item.id)}
                              disabled={count === 0}
                              className="p-3 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <FaMinus className="text-sm" />
                            </button>

                            <span className="px-6 py-2 font-bold text-xl text-gray-900">
                              {count}
                            </span>

                            <button
                              onClick={() => increment(item.id)}
                              className="p-3 text-gray-700 hover:bg-gray-200 transition"
                            >
                              <FaPlus className="text-sm" />
                            </button>
                          </div>

                          <button
                            onClick={() => openNotesForItem(item)}
                            disabled={count === 0}
                            className={`
                              p-4 rounded-xl font-bold text-white shadow-lg transition-all flex-shrink-0
                              ${count > 0
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105"
                                : "bg-gray-300 cursor-not-allowed"
                              }
                            `}
                          >
                            <FaCart className="text-xl" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-96 border-l border-gray-300 bg-white shadow-xl">
          <div className="flex-1 overflow-y-auto p-6">
            <CartInfo lockRemoval={lockRemoval} lockedTable={lockedTable} />
          </div>
          <div className="border-t border-gray-300 p-6 bg-gray-50">
            <Bill
              mode={mode}
              orderId={orderId}
              lockedTable={lockedTable}
              lockTableSelection={mode === "append"}
            />
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Cart Bar */}
      {totalCartItems > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-300 shadow-2xl">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full px-6 py-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-lg">
                <MdShoppingCart className="text-2xl" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">
                  {totalCartItems} {totalCartItems === 1 ? "artículo" : "artículos"}
                </div>
                <div className="text-xl font-bold text-blue-700">${cartTotal.toFixed(2)}</div>
              </div>
            </div>
            <span className="text-lg font-bold text-green-600">Ver carrito →</span>
          </button>
        </div>
      )}

      {/* Notes Modal */}
      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setNoteOpen(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Notas para {noteTarget?.item?.name}
                    </h3>
                    <p className="text-lg text-gray-600 mt-1">
                      Cantidad: <span className="font-bold">{noteTarget?.count}</span>
                    </p>
                  </div>
                  <button onClick={() => setNoteOpen(false)} className="text-3xl text-gray-500">
                    &times;
                  </button>
                </div>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder='Ej: "Sin cebolla", "Bien cocido", "Salsa aparte"...'
                  className="w-full h-32 p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none text-lg"
                />

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setNoteOpen(false)}
                    className="flex-1 py-4 rounded-2xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAddWithNotes}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-50 lg:hidden bg-white flex flex-col"
          >
            <div className="p-5 border-b border-gray-300 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <MdShoppingCart className="text-green-600" /> Carrito
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-3xl text-gray-600">
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <CartInfo lockRemoval={lockRemoval} lockedTable={lockedTable} />
            </div>

            <div className="border-t-2 border-gray-300 p-6 bg-gray-50">
              <Bill
                mode={mode}
                orderId={orderId}
                lockedTable={lockedTable}
                lockTableSelection={mode === "append"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menu;