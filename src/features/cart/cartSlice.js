import { createSlice } from "@reduxjs/toolkit";

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState: { value: loadCartFromStorage() },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.value.find((i) => i.id === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.value.push({ ...item, quantity: 1 });
      }
      
      // Save to localStorage after adding
      saveCartToStorage(state.value);
    },

    removeFromCart: (state, action) => {
      const id = action.payload;
      state.value = state.value.filter((item) => item.id !== id);
      
      // Save to localStorage after removing
      saveCartToStorage(state.value);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.value.find((item) => item.id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
      } else if (item && quantity <= 0) {
        // Remove item if quantity is 0 or negative
        state.value = state.value.filter((item) => item.id !== id);
      }
      
      // Save to localStorage after updating
      saveCartToStorage(state.value);
    },

    clearCart: (state) => {
      state.value = [];
      
      // Save to localStorage after clearing
      saveCartToStorage(state.value);
    }
  }
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart
} = cartSlice.actions;

export default cartSlice.reducer;
