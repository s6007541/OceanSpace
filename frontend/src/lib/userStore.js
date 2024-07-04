import { create } from "zustand";
import { BACKEND_URL } from "../lib/config";
import axios from "axios";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  // fetchUserInfo: async (uid) => {
  //   if (!uid) return set({ currentUser: null, isLoading: false });

  //   try {
  //     set({ isLoading: true })
  //     const res = await fetch(`${BACKEND_URL}/user-info/id/${uid}`, {
  //       credentials: "include",
  //     });
  //     if (!res.ok) {
  //       throw new Error(res.detail);
  //     }
  //     const user = await res.json();
  //     set({ currentUser: user });
  //   } catch (err) {
  //     console.log(err);
  //   } finally {
  //     set({ isLoading: false });
  //   }
  // },
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
}));
