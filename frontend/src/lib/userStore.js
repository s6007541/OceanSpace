import { create } from "zustand";
import axios from "axios";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  fetchCurrentUserInfo: async () => {
    try {
      set({ isLoading: true });
      const res = await axios.get("/user-info");
      set({ currentUser: res.data });
    } catch (err) {
      console.log(err);
    } finally {
      set({ isLoading: false });
    }
  },
  updateCurrentUserInfo: async (data) => {
    try {
      const res = await axios.put("/user-info", data);
      const user = res.data;
      set({ currentUser: user, isLoading: false });
    } catch (err) {
      console.log(err);
    }
  },
  resetCurrentUser: () => {
    set({ currentUser: null, isLoading: false});
  },
}));
