  import { axiosWrapper } from "./axiosWrapper";
  import { removeUser } from "../redux/slices/userSlice";
  import store from "../redux/store";

  // API Endpoints

  // Auth Endpoints
  export const login = (data) => axiosWrapper.post("/api/user/login", data);
  export const register = (data) => axiosWrapper.post("/api/user/register", data);
  export const getUserData = () => axiosWrapper.get("/api/user");
  export const logout = () => axiosWrapper.post("/api/user/logout");

  // Table Endpoints
  export const addTable = (data) => axiosWrapper.post("/api/table/add", data);
  export const getTables = () => axiosWrapper.get("/api/table");
  export const updateTable = ({ tableId, ...tableData }) =>
    axiosWrapper.put(`/api/table/${tableId}`, tableData);

  // Order Endpoints
  export const addOrder = (data) => axiosWrapper.post("/api/orders/", data);
  export const getOrders = () => axiosWrapper.get("/api/orders");
  export const updateOrderStatus = ({ orderId, orderStatus }) =>
    axiosWrapper.put(`/api/orders/${orderId}`, { orderStatus });

  // Cash / Caja Endpoints (NUEVOS, si quieres centralizarlos aquí también)
  export const getCashBalance = () => axiosWrapper.get("/api/cash-balance");
  export const getCashMovements = () => axiosWrapper.get("/api/cash-register");
  export const postCashMovement = (data) =>
    axiosWrapper.post("/api/admin/cash-movement", data);

  // Logout
  export const logoutUser = () => {
    localStorage.removeItem("token");
    store.dispatch(removeUser());
    window.location.href = "/auth";


    
  };


  //menu
  // Category Endpoints
  export const getCategories = () => axiosWrapper.get("/api/categories");
  export const addCategory = (data) => axiosWrapper.post("/api/categories", data);

  // Dish Endpoints
  export const getDishes = () => axiosWrapper.get("/api/dishes");
  export const addDish = (data) => axiosWrapper.post("/api/dishes", data);

  // Category Endpoints

  export const updateCategory = (id, data) => axiosWrapper.put(`/api/categories/${id}`, data);

  // Dish Endpoints

  export const updateDish = (id, data) => axiosWrapper.put(`/api/dishes/${id}`, data);