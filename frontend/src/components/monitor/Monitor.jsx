import { useEffect, useRef, useState } from "react";
import "./monitor.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Monitor = () => {

  return (
    <div className="chat">
     Monitor
    </div>
  );
};

export default Monitor;
