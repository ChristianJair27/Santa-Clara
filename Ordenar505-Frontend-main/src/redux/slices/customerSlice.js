import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orderId: "",
  customerName: "",
  customerPhone: "",
  guests: 0,
  table: null,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setCustomer: (state, action) => {
      const { name, phone, guests } = action.payload;
      state.orderId = `order-${Date.now()}`; // más descriptivo y serializable
      state.customerName = name;
      state.customerPhone = phone;
      state.guests = guests;
    },

    removeCustomer: (state) => {
      return initialState; // ✅ Resetea todo, incluyendo orderId
    },

    updateTable: (state, action) => {
      state.table = action.payload.table;
    },
  },
});

export const { setCustomer, removeCustomer, updateTable } = customerSlice.actions;
export default customerSlice.reducer;