import { useEffect, useRef, useState } from "react";
import "./chatList.css";
import OptionMenu from "./optionMenu/optionMenu";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import { useSocket } from "../../../lib/socket";
import { STATIC_BASE } from "../../../lib/config";
import { LLM_DICT, LLM_LIST } from "../../../lib/llm_lists";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ChatList = ({ setIsSlidingLeft }) => {
  const navigate = useNavigate();

  const goSeeAll = (current_chat_list) => {
    const chat_alias_list = filteredChats.map((e) => e.user.alias);
    setIsSlidingLeft(true);
      setTimeout(() => {
        navigate("/AddFriend", { state: chat_alias_list });
      }, 200); // Match the timeout to the animation duration (0.7s)
    
  };
  
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [pressTimer, setPressTimer] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();
  const { socket } = useSocket();
  const socketListenerRef = useRef(null);

  const fetchChatList = async () => {
    // Get chat list.
    try {
      // get chat data
      const res = await axios.get("/user-chats")
      const userChats = res.data;
      const promises = userChats.map(async (userChat) => {
        const res = await axios.get(`/user-info/id/${userChat.receiverId}`)
        const user = res.data;
        return { ...userChat, user };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData);
      setReady(true);
    } catch (err) {
      console.log(err);
    }
  }

  const socketMessageListener = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "update-chat" || data.type === "message") {
      await fetchChatList();
    }
  };

  useEffect(() => {
    if (!socket || socketListenerRef.current) {
      return;
    }
    if (chatId === null) {
      socketListenerRef.current = socketMessageListener;
      socket.addEventListener("message", socketMessageListener);
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      if (chatId === null) {
        if (!socketListenerRef.current) {
          socketListenerRef.current = socketMessageListener;
          socket.addEventListener("message", socketMessageListener);
        }
      } else {
        socket.removeEventListener("message", socketListenerRef.current);
      }
    }
  }, [chatId]);

  useEffect(() => {
    if (currentUser.id === null) {
      return;
    }
    fetchChatList();
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const { user, ...userChat } = chat;
    userChat.isSeen = true;
    userChat.unreadMessages = 0;
    try {
      await axios.put("/user-chats", userChat);
      changeChat(userChat, user);

      setIsSlidingLeft(true);
      setTimeout(() => {
        navigate("/Chat");
      }, 200); // Match the timeout to the animation duration (0.7s)
      
    } catch (err) {
      console.log(err);
    }

  };

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({
      chat,
      position: { x: e.pageX, y: e.pageY },
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleShowUserId = () => {
    alert(`User ID: ${contextMenu.chat.user.id}`);
    handleCloseContextMenu();
  };

  const handleDeleteChat = async () => {
    try {
      await axios.delete(`/user-chats/${contextMenu.chat.chatId}`);
      await fetchChatList();
    } catch (err) {
      console.log(err);
    }
  };

  const handleTouchStart = (e, chat) => {
    e.preventDefault();
    const timer = setTimeout(() => {
      setContextMenu({
        chat,
        position: { x: e.pageX, y: e.pageY },
      });
    }, 500);
    setPressTimer(timer);
  };

  const handleTouchEnd = (e) => {
    clearTimeout(pressTimer);
    setPressTimer(null);
    if (contextMenu) {
      e.preventDefault();
    }
  };

  const handleAddLLM = async (LLMId) => {
    try {
      let res = await axios.get(`/user-info/name/${LLMId}`);
      const llmInfo = res.data;
      res = await axios.post("/user-chats", { receiverId: llmInfo.id });
      await fetchChatList();
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );
  if (!ready) return 
  <div className="outer">
    (
      <div className="outer_chatlist">
        <div className="addbar">
          <p className="addbar_text">ข้อความ</p>
          <a className="add_text">
            +{" "}
          </a>
        </div>
      </div>
    )
  </div>
      
  
  return (
    <div className="outer">
      {(filteredChats.length > 0) && ready ? (
        <div className="outer_chatlist">
          <div className="addbar">
            <p className="addbar_text">ข้อความ</p>
            <a
              onClick={() => {
                goSeeAll(filteredChats);
              }}
              className="add_text"
            >
              +{" "}
            </a>
          </div>
          <div className="chatList" onClick={handleCloseContextMenu}>
            {filteredChats.map((chat) => (
              <div
                className="item"
                key={chat.chatId}
                onClick={() => handleSelect(chat)}
                onTouchStart={(e) => handleTouchStart(e, chat)}
                onTouchEnd={(e) => handleTouchEnd(e)}
                onContextMenu={(e) => handleContextMenu(e, chat)}
              >
                <img
                  src={
                    `${STATIC_BASE}/SeaCharacters/Small-56px/${LLM_DICT[chat.user.alias].avatar}` ||
                    `${STATIC_BASE}/avatar.png`
                  }
                  alt=""
                />
                <div className="texts no-select">
                  <span>{chat.user.username}</span>
                  <p>{chat.lastMessage}</p>
                  {/* <p>{chat.lastMessage.length > 0 ? chat.lastMessage.slice(0, 28) + (chat.lastMessage.length > 28 ? "..." : "") : ""}</p> */}
                </div>
                {/* <div className="noti" style={{background: `var(--OceanSpace-Brand-Primary, ${LLM_LIST.includes(chat.user.id) ? LLM_DICT[chat.user.id].color : "#0D7FE8"})`}}>1</div> */}
                {chat.unreadMessages > 0 ? (
                  <div
                    className="noti"
                    style={{
                      background: `var(--OceanSpace-Brand-Primary, #0D7FE8)`,
                    }}
                  >
                    {chat.unreadMessages}
                  </div>
                ) : (
                  <></>
                )}
                {chat.lastMessage?.length > 0 ? (
                  <></>
                ) : (
                  <div
                    className="noti"
                    style={{
                      background: `var(--OceanSpace-Brand-Primary, #0D7FE8})`,
                    }}
                  >
                    เริ่มแชท
                  </div>
                )}
              </div>
            ))}

            {contextMenu && (
              <OptionMenu
                position={contextMenu.position}
                onClose={handleCloseContextMenu}
                onShowUserId={handleShowUserId}
                onDeleteChat={handleDeleteChat}
              />
            )}
          </div>
        </div>
      ) : <></>}
      
      {(filteredChats.length === 0) && ready ? (
        <div className="first_time">
          <div className="desc-top">
            สวัสดี เราคือ Ocean Space! <br />
            แอพสำหรับการระบายความเครียด คุณมีเรื่องอะไรอยากเล่าให้เราฟังมั้ย
            เพิ่มเพื่อนข้างล่างได้เลย
          </div>
          <div className="center">
            <img src={`${STATIC_BASE}/SeaCharacters/Large-150px/Whale.svg`}></img>
            <div className="desc-container">
              <div className="desc-head">สีน้ำเงิน</div>
              <div className="desc">พี่ชายที่อบอุ่นแบบเตาไมโครเวฟ</div>
            </div>
            <div className="tag_outer">
              <div className="tag_inner">
                <div className="tag">ใจดี</div>
                <div className="tag">เป็นผู้ฟังที่ดี</div>
                <div className="tag">ไม่ตัดสิน</div>
              </div>
              <div className="tag_inner">
                <div className="tag">สุภาพ</div>
                <div className="tag">อบอุ่น</div>
                <div className="tag">ให้กำลังใจ</div>
              </div>
            </div>
          </div>
          <div className="bottom">
            <button
              className="addfriend"
              onClick={() => handleAddLLM(LLM_DICT[LLM_LIST[0]].id)}
            >
              + เพิ่มพี่ชาย “สีน้ำเงิน”
            </button>
            <a
              className="seeall"
              onClick={() => {
                goSeeAll(filteredChats);
              }}
            >
              ดูรายชื่อเพื่อนทั้งหมด
            </a>
          </div>
        </div>
      ) : <></> }
    </div>
  );
};

export default ChatList;
