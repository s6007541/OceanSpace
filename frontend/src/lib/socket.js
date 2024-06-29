import { create } from "zustand";

export const useSocket = create((set) => ({
  socket: null,
  socketConnected: false,
  socketConnect: (url) => {
    // Connect the socket.
    const ws = new WebSocket(url);
    set({ socketConnected: true });
    ws.addEventListener("open", (_) => {
      set({ socket: ws });
    });
  },
}));
