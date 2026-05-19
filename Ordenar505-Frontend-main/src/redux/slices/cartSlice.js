import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItems: (state, action) => {
      state.push(action.payload);
    },

    removeItem: (state, action) => {
      return state.filter((item) => item.id != action.payload);
    },

    removeAllItems: () => {
      return [];
    },

    // 👇 nuevo: reemplazar todo el carrito con un array de items
    importItems: (state, action) => {
      return Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

// selector
export const getTotalPrice = (state) =>
  state.cart.reduce((total, item) => total + item.price, 0);

// exporta también importItems
export const { addItems, removeItem, removeAllItems, importItems } =
  cartSlice.actions;

export default cartSlice.reducer;
