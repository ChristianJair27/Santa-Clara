import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaShoppingCart, FaPlus, FaMinus, FaCheck } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";

const MenuContainer = () => {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [itemCounts, setItemCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const API = import.meta.env.VITE_BACKEND_URL;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, dishRes] = await Promise.all([
        axios.get(`${API}/api/categories`),
        axios.get(`${API}/api/dishes`),
      ]);
      setCategories(catRes.data.data);
      setDishes(dishRes.data.data);
      if (catRes.data.data.length > 0) {
        setSelectedCategory(catRes.data.data[0]);
      }

      const initialCounts = {};
      dishRes.data.data.forEach(dish => {
        initialCounts[dish.id] = 0;
      });
      setItemCounts(initialCounts);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const increment = (id) => {
    setItemCounts(prev => ({
      ...prev,
      [id]: prev[id] < 20 ? prev[id] + 1 : prev[id]
    }));
  };

  const decrement = (id) => {
    setItemCounts(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : prev[id]
    }));
  };

  const handleAddToCart = (item) => {
    const count = itemCounts[item.id];
    if (count === 0) return;

    const newItem = {
      id: `item-${Date.now()}`,
      name: item.name,
      pricePerQuantity: item.price,
      quantity: count,
      price: item.price * count,
      dishId: item.id
    };

    dispatch(addItems(newItem));
    setItemCounts(prev => ({ ...prev, [item.id]: 0 }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6">
      {/* Sección de Categorías - Carrusel de Tarjetas */}
      <div className="flex overflow-x-auto pb-4 gap-4 hides-scrollbar-desktop">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className={`
              flex-shrink-0 min-w-[150px] md:min-w-[180px] h-28 rounded-xl p-4 flex flex-col justify-between items-start
              transition-all duration-300 ease-in-out cursor-pointer
              shadow-2xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2
              ${selectedCategory?.id === category.id
                ? "text-white ring-blue-500 ring-offset-blue-100"
                : "bg-white text-gray-800 hover:bg-gray-100 ring-gray-200 ring-offset-white"
              }
            `}
            style={{
              backgroundColor: selectedCategory?.id === category.id ? category.bg_color || '#2563eb' : 'white',
              color: selectedCategory?.id === category.id ? 'white' : 'inherit',
            }}
            aria-pressed={selectedCategory?.id === category.id}
          >
            <div className="flex items-center justify-between w-full">
              {category.icon && (
                <span className={`text-2xl md:text-3xl ${selectedCategory?.id === category.id ? 'text-white' : 'text-gray-600'}`}>
                  {category.icon}
                </span>
              )}
              {selectedCategory?.id === category.id && (
                <FaCheck className="text-white text-base md:text-xl" />
              )}
            </div>
            
            <div className="text-left mt-2 w-full">
              <h3 className="font-bold text-base md:text-lg leading-tight line-clamp-1">
                {category.name}
              </h3>
              <p className="text-xs text-opacity-80">
                <span className="font-semibold">{dishes.filter(d => d.category_id === category.id).length}</span> articulos
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Platillos */}
      <div className="mt-6 mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">
          {selectedCategory ? `${selectedCategory.name}` : "Selecciona una categoría"}
        </h2>
        
        {dishes.filter(dish => dish.category_id === selectedCategory?.id).length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500 text-base md:text-lg">No hay platillos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {dishes
              .filter((dish) => dish.category_id === selectedCategory?.id)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2">{item.name}</h3>
                        
                      </div>
                      {item.description && (
                        <p className="text-gray-600 text-xs md:text-2xl mt-1 line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </div>

<span className="text-lg md:text-xl font-bold text-blue-600 whitespace-nowrap ml-2">
                          ${Number(item.price).toFixed(2)}
                        </span>

                    <div className="mt-auto flex items-center justify-between">



    
                      <div className="flex items-center bg-gray-100 rounded-full border border-gray-200">
    
                        <button
                          onClick={() => decrement(item.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          disabled={itemCounts[item.id] === 0}
                          aria-label={`Di2xlinuir cantidad de ${item.name}`}
                        >
                          <FaMinus className="text-2xl" />
                        </button>
                        <span className="px-3 font-semibold min-w-[30px] text-center text-2xl md:text-base text-gray-800">
                          {itemCounts[item.id]}
                        </span>
                        <button
                          onClick={() => increment(item.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <FaPlus className="text-2xl" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={itemCounts[item.id] === 0}
                        className={`flex items-center px-4 py-2 rounded-full text-2xl font-semibold shadow-md
                          ${itemCounts[item.id] > 0
                            ? "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          } transition-all duration-200 ease-in-out
                        `}
                      >
                        <FaShoppingCart className="mr-1 text-2x1" />
                        
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuContainer;
