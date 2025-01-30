import { create } from "zustand";

export const useSocket = create((set, get) => ({
  socket: null,
  socketConnected: false,
  pendingMessages: [],
  pendingMessageCount: 0,
  doneMessageIds: [],
  socketConnect: (url) => {
    if (get().socketConnected) {
      return;
    }

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
        const pending = get().pendingMessages;
        const done = get().doneMessageIds;
        try {
          while (pending.length > 0) {
            const { id, message } = pending.shift();
            ws.send(JSON.stringify(message));
            done.push(id);
          }
        } catch (err) {
          console.log(err);
        }
        set({ pendingMessages: [...pending], doneMessageIds: [...done] });
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
  addPendingMessages: (message) => {
    const ws = get().socket;
    if (ws) {
      try {
        ws.send(JSON.stringify(message));
        return null;
      } catch (err) {
        console.log(err);
      }
    }
    const count = get().pendingMessageCount;
    const pending = get().pendingMessages;
    pending.push({ id: count, message: message });
    set({ pendingMessages: [...pending], pendingMessageCount: count + 1 });
    return count;
  },
  setDoneMessageIds: (messages) => {
    set({ doneMessageIds: messages });
  },
}));
