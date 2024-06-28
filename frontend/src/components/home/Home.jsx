import { useEffect, useRef, useState } from "react";
import "./home.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Home = () => {

  return (
    <div className="chat">
     <a href="/">home</a>
     <a href="/ChatList">ChatList</a>
     <a href="/Chat">Chat</a>
     <a href="/Monitor">Monitor</a>
     <a href="/Login">login</a>
     <a href="/Signup">signup</a>
     <a href="/AddFriend">AddFriend</a>
     <a href="/Custom">Custom</a>
     <a href="/myprofile">myprofile</a>
     <a href="/llmprofile">llmprofile</a>


    </div>
  );
};

export default Home;
