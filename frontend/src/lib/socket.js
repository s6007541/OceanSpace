import { create } from "zustand";

export const useSocket = create((set) => ({
  socket: null,
  socketConnected: false,
  socketConnect: (url) => {
    // Connect the socket.
    const token = localStorage.getItem("token");
    if (token) {
      const ws = new WebSocket(url);
      // const ws = new WebSocket(url, ["Authorization", token]);
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
    } else {
      console.log("No token found.");
    }
  },
}));
