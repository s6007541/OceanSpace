import { useEffect, useRef, useState } from "react";
import "./myprofile.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Myprofile = () => {

  return (
    <div className="chat">
     Myprofile
    </div>
  );
};

export default Myprofile;
