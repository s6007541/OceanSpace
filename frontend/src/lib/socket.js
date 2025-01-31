import { create } from "zustand";
import { WEBSOCKET_URL } from "./config";

const retryPeriod = 5000;

export const useSocket = create((set, get) => ({
  socket: null,
  socketConnected: false,
  pendingMessages: [],
  pendingMessageCount: 0,
  socketConnect: () => {
    if (get().socketConnected) {
      return;
    }

    // Connect the socket.
    const token = localStorage.getItem("token");
    if (token) {
      let ws = null;
      try {
        ws = new WebSocket(WEBSOCKET_URL);
      } catch (err) {
        console.log(err);
        // Periodic retry
        setTimeout(() => {
          get().socketConnect();
        }, retryPeriod);
        return;
      }
      set({ socketConnected: true });
      ws.addEventListener("open", (_) => {
        set({ socket: ws });
        ws.send(
          JSON.stringify({
            type: "authenticate",
            data: { access_token: token },
          })
        );
        const pending = get().pendingMessages;
        try {
          while (pending.length > 0) {
            const message = pending.shift();
            ws.send(JSON.stringify(message));
          }
        } catch (err) {
          console.log(err);
        }
        set({ pendingMessages: [...pending] });
      });
      ws.addEventListener("close", (_) => {
        set({ socket: null, socketConnected: false });
        // Periodic retry
        setTimeout(() => {
          get().socketConnect();
        }, retryPeriod);
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
  sendMessage: (type, senderId, data) => {
    const ws = get().socket;
    const count = get().pendingMessageCount;
    const id = count.toString();
    data.clientId = id;
    set({ pendingMessageCount: count + 1 });
    const packet = { type, senderId, data };
    if (ws) {
      try {
        ws.send(JSON.stringify(packet));
        return id;
      } catch (err) {
        console.log(err);
      }
    }
    const pending = get().pendingMessages;
    pending.push(packet);
    set({ pendingMessages: [...pending] });
    get().socketConnect();
    return id;
  },
}));
