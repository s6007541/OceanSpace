import { create } from "zustand";

export const useError = create((set) => ({
  error_messages: null,
  loadErrorMessages: (url) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch JSON");
        }
        return response.json();
      })
      .then((jsonData) => {
        set({ error_messages: jsonData });
      })
      .catch((err) => {
        console.log(err);
      });
  },
}));
