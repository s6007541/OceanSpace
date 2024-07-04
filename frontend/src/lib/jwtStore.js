import { create } from "zustand";

export const useJwtStore = create((set) => ({
  token: localStorage.getItem("token"),
  setToken_: (newToken) => set({ token: newToken }),
}));
