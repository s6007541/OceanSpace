import ChatList from "./chatList/ChatList"
import "./list.css";
import Userinfo from "./userInfo/Userinfo";
import Navbar from "../../components/navbar/Navbar";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const List = () => {
  const [addMode, setAddMode] = useState(false);
  const location = useLocation();
  // if (location?.state?.socket_disconnect) {
  //   // reset notification

  // }

  return (
    <div className="list">
      <Userinfo />
      <Navbar />
      <ChatList setAddMode={setAddMode} />

    </div>
  );
};

export default List;
