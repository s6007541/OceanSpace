import ChatList from "./chatList/ChatList"
import "./list.css";
import Userinfo from "./userInfo/Userinfo";
import Navbar from "../../components/navbar/Navbar";
import { useState, useEffect } from "react";

const List = () => {
  const [isSlidingLeft, setIsSlidingLeft] = useState(false);

  return (
    <div className={`list ${isSlidingLeft ? 'slide-left' : ''}`}>
      <Userinfo />
      <Navbar />
      <ChatList setIsSlidingLeft={setIsSlidingLeft} />

    </div>
  );
};

export default List;
