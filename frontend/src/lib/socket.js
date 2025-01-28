import { create } from "zustand";

export const useSocket = create((set, get) => ({
  socket: null,
  socketConnected: false,
  socketConnect: (url) => {
    // Connect the socket.
    const token = localStorage.getItem("token");
    if (token) {
      const ws = new WebSocket(url);
      set({ socketConnected: true });
      ws.addEventListener("open", (_) => {
        set({ socket: ws });
        ws.send(
          JSON.stringify({
            type: "authenticate",
            data: { access_token: token },
          })
        );
      });
      ws.addEventListener("close", (_) => {
        set({ socket: null, socketConnected: false });
      });
    } else {
      console.log("No token found.");
    }
  },
  socketDisconnect: () => {
    const { socket, socketConnected } = get();
    if (socketConnected && socket) {
      socket.close();
      set({ socket: null, socketConnected: false });
    }
  },
}));
