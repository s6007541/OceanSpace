import ChatList from "./chatList/ChatList"
import "./list.css";
import Userinfo from "./userInfo/Userinfo";
import Navbar from "../../components/navbar/Navbar";
import { useState, useEffect } from "react";

const List = () => {
  const [addMode, setAddMode] = useState(false);

  return (
    <div className="list">
      <Userinfo />
      <Navbar />
      <ChatList setAddMode={setAddMode} />

    </div>
  );
};

export default List;
