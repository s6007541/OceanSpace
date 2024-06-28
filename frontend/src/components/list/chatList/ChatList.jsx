import { useEffect, useState } from "react";
import "./chatList.css";
import OptionMenu from "./optionMenu/optionMenu";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import { useSocket } from "../../../lib/socket";
import { BACKEND_URL } from "../../../lib/config";
// TODO import socket
import { LLM_DICT, LLM_LIST } from "../../../lib/llm_lists";
import { useNavigate } from "react-router-dom";

const ChatList = ({ setAddMode }) => {
  const navigate = useNavigate();

  const goSeeAll = (current_chat_list) => {
    const chat_alias_list = filteredChats.map((e) => e.user.alias);
    console.log(chat_alias_list);
    navigate("/AddFriend", { state: chat_alias_list });
  };

  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();
  const { socket } = useSocket();

  async function fetchChatList() {
    // Get chat list.
    try {
      // get chat data
      const res = await fetch(`${BACKEND_URL}/user-chats`, {
        credentials: "include",
      });
      const userChats = await res.json();
      const promises = userChats.map(async (userChat) => {
        const res = await fetch(
          `${BACKEND_URL}/user-info/id/${userChat.receiverId}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch user info.");
        }
        const user = await res.json();
        return { ...userChat, user };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "update-chat" || data.type === "message") {
        await fetchChatList();
      }
    });
  }, [socket]);

  useEffect(() => {
    if (currentUser.id === null) {
      return;
    }
    fetchChatList();
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const { user, ...userChat } = chat;
    userChat.isSeen = true;
    try {
      const res = await fetch(`${BACKEND_URL}/user-chats`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userChat),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to update chat");
      }
      changeChat(userChat, user);
      navigate("/Chat");
    } catch (err) {
      console.log(err);
    }
  };

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    console.log(e);
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
      const res = await fetch(
        `${BACKEND_URL}/user-chats/${contextMenu.chat.chatId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) {
        throw new Error("Failed to delete chat");
      }
      await fetchChatList();
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddLLM = async (LLMId) => {
    try {
      let res = await fetch(`${BACKEND_URL}/user-info/name/${LLMId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to get user info");
      }
      const llmInfo = await res.json();
      res = await fetch(`${BACKEND_URL}/user-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: llmInfo.id,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to create new chat");
      }
      await fetchChatList();
      setAddMode(false);
    } catch (err) {
      console.log(err);
    }
  };
  setTimeout(() => {
    setReady(true);
  }, 500);

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );
  if (!ready) return <></>;

  return (
    <div className="outer">
      {filteredChats.length > 0 ? (
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
                onContextMenu={(e) => handleContextMenu(e, chat)}
              >
                <img
                  src={
                    `${BACKEND_URL}/profile-image/${chat.receiverId}` ||
                    "./avatar.png"
                  }
                  alt=""
                />
                <div className="texts">
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
            {/* {addMode && <AddUser addMode={addMode} setAddMode={setAddMode} />} */}

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
      ) : (
        <div className="first_time">
          <div className="desc-top">
            สวัสดี เราคือ Ocean Space! <br />
            แอพสำหรับการระบายความเครียด คุณมีเรื่องอะไรอยากเล่าให้เราฟังมั้ย
            เพิ่มเพื่อนข้างล่างได้เลย
          </div>
          <div className="center">
            <img src="./SeaCharacters/Large-150px/Whale.svg"></img>
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
      )}
    </div>
  );
};

export default ChatList;
