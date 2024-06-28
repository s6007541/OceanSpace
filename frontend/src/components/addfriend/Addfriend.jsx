import { useEffect, useRef, useState } from "react";
import "./addfriend.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Addfriend = () => {

  return (
    <div className="chat">
     Addfriend
    </div>
  );
};

export default Addfriend;
