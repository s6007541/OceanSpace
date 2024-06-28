import { create } from "zustand";
import { BACKEND_URL } from "../lib/config";

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
      const res = await fetch(`${BACKEND_URL}/user-info`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(res.detail);
      }
      const user = await res.json();
      set({ currentUser: user });
    } catch (err) {
      console.log(err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
