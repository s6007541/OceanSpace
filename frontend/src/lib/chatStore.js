import { create } from "zustand";
// import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null,
  chatData: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  changeChat: (chat, user) => { // user is one that current_user wanna chat
    // const currentUser = useUserStore.getState().currentUser;

    // CHECK IF CURRENT USER IS BLOCKED
    // if (user.blocked.includes(currentUser.id)) {
    //   return set({
    //     chatId,
    //     user: null,
    //     isCurrentUserBlocked: true,
    //     isReceiverBlocked: false,
    //   });
    // }

    // CHECK IF RECEIVER IS BLOCKED
    // else if (currentUser.blocked.includes(user.id)) {
    //   return set({
    //     chatId,
    //     user: user,
    //     isCurrentUserBlocked: false,
    //     isReceiverBlocked: true,
    //   });
    // } else {
    //   return set({
    //     chatId,
    //     user,
    //     isCurrentUserBlocked: false,
    //     isReceiverBlocked: false,
    //   });
    // }
    return set({
      chatId: chat.chatId,
      chatData: chat,
      user,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },

  changeBlock: () => {
    set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
  },
  resetChat: () => {
    set({
      chatId: null,
      chatData: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
  setDetail: () => {
    set({
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
  setChat: () => {
    set({
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));
