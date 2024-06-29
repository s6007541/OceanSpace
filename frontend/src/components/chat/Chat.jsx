import { useEffect, useRef, useState } from "react";
import "./chat.css";
import { toast } from "react-toastify";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { LLM_LIST } from "../../lib/llm_lists";
import { useSocket } from "../../lib/socket";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../lib/config";

const Chat = () => {
  const navigate = useNavigate(); 
  
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [openFeedback, setOpenFeedback] = useState(-1);
  const [startWait, setStartWait] = useState(true);
  const [latestRead, setLatestRead] = useState(-3);
  const [textReady, setTextReady] = useState(true);
  const [checkpoint, setCheckpoint] = useState(20);
  const [emotionMode, setEmotionMode] = useState("");
  const [choosing, setChoosing] = useState(false);

  const { currentUser } = useUserStore();
  const {
    chatId,
    chatData,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    resetChat,
    setDetail,
  } = useChatStore();
  const { socket } = useSocket();

  const chatRef = useRef();
  const socketHandledRef = useRef(false);
  const endRef = useRef(null);
    
  // useEffect(() => {
  //   if (textReady === false) {
      
  //   }
  // }, [textReady]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (chatId === null) {
        
        navigate("/ChatList", { replace: true , state : {socket_disconnect : true}});
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/messages/${chatId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch messages.");
        }
        const messages = await res.json();
        chatRef.current = messages;
        setChat([...chatRef.current]);
      } catch (err) {
        console.log(err);
      }
    }

    fetchMessages();
  }, [chatData]);

  useEffect(() => {
    if (!socket || socketHandledRef.current) {
      return;
    }
    socketHandledRef.current = true;
    socket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        chatRef.current.push(data.data);
        setChat([...chatRef.current]);
        if (data.data.last_one === true){
          setTextReady(true); // bubble stop
          setLatestRead(chatRef.current.length);

        }
      } else if (data.type === "checkpoint") {
        console.log("Topic of interest: ", data.data)
      }
    });
  }, [socket]);


  const handleBack = async (e) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user-chats/${chatId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user chats.");
      }
      const userChat = await res.json();
      userChat.unreadMessages = 0;
      await fetch(`${BACKEND_URL}/user-chats`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userChat),
        credentials: "include",
      });
    } catch (err) {
      console.log(err);
    }

    navigate("/ChatList");
    resetChat();
  };

  
  const handleOpenFeedback = (e, isOwn) => {
    if (!isOwn) {
      setOpenFeedback((old_id) => (old_id === e.target.id ? -1 : e.target.id));
    }
  };

  const handleFeedback = async (e) => {
    try{
      const res = await fetch(`${BACKEND_URL}/user-chats/${chatId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user chats.");
      }
      const userChat = await res.json();
      if (e.target.id === "angry") {
        userChat.blacklist.push(chatRef.current[openFeedback].text);
      } else {
        userChat.whitelist.push(chatRef.current[openFeedback].text);
      }
      await fetch(`${BACKEND_URL}/user-chats`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userChat),
        credentials: "include",
      });
      setOpenFeedback(-1);
      toast.success(`Feedback has been received! "${user.username}" will enhance the response according to your suggestions.`);
    } catch (err){
      console.log(err);
    }
  };

  const handleSend = async () => {
    if (latestRead === -3) {
      setLatestRead(chatRef.current.length);
    }
    
    if (text === "") return;


    try {
      const message = {
        chatId: chatId,
        senderId: currentUser.id,
        createdAt: Date.now(),
        text: text,
        buffer: true,
      };
      const message_packet = {
        type: "message",
        senderId: currentUser.id,
        data: message,
      };
      socket.send(JSON.stringify(message_packet));
      chatRef.current.push(message);
      setChat([...chatRef.current]);
    } catch (err) {
      console.log(err);
    } finally {
      setText("");
    }

    if (LLM_LIST.includes(user.alias)) {
      if (startWait === false){
        return;
      }

      setStartWait(false);
      console.log(latestRead)

      setTimeout(()=>{
        setTextReady(false); //bubble start
        setLatestRead(-2);
      }, 3000);

      setTimeout(async () => {
        setStartWait(true);

        const message = {
          chatId: chatId,
          senderId: user.id,
          createdAt: Date.now(),
          text: "",
          buffer: false,
        }
        const message_packet = {
          type: "commit-messages",
          senderId: user.id,
          data: message,
        };

        try {
          socket.send(JSON.stringify(message_packet));
          // setTextReady(true); // bubble stop
          // setLatestRead(chatRef.current.length);
        } catch (err) {
          console.log(err);
        }

        if (chatRef.current.length > checkpoint) {
          setCheckpoint(chatRef.current.length + 20);
          const message = {
            chatId: chatId,
            senderId: user.id,
            createdAt: Date.now(),
            text: "",
            buffer: false,
          }
          const message_packet = {
            type: "checkpoint",
            senderId: user.id,
            data: message,
          }
          socket.send(JSON.stringify(message_packet));
        }
      }, 6000);
    }
  };

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <svg className="goback" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" onClick={handleBack}>
            <path d="M12.7071 19.7071C12.3166 20.0976 11.6834 20.0976 11.2929 19.7071L4.29289 12.7071C3.90237 12.3166 3.90237 11.6834 4.29289 11.2929L11.2929 4.29289C11.6834 3.90237 12.3166 3.90237 12.7071 4.29289C13.0976 4.68342 13.0976 5.31658 12.7071 5.70711L7.41421 11L19 11C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13L7.41421 13L12.7071 18.2929C13.0976 18.6834 13.0976 19.3166 12.7071 19.7071Z" fill="black"/>
          </svg>
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>
        <div className="button-select-emotion">
          <div className="button-text">{emotionMode === "" ? "เลือก" : emotionMode}</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M1.99305 5.41996C1.66638 5.74663 1.66638 6.27329 1.99305 6.59996L7.53305 12.14C7.79305 12.4 8.21305 12.4 8.47305 12.14L14.013 6.59996C14.3397 6.27329 14.3397 5.74663 14.013 5.41996C13.6864 5.09329 13.1597 5.09329 12.833 5.41996L7.99971 10.2466L3.16638 5.41329C2.84638 5.0933 2.31305 5.09329 1.99305 5.41996Z" fill="#0D7FE8"/>
          </svg>
        </div>
      </div>

      
      <div className="center">
        {chat?.length === 0 ? 
        <div className="chat-greeting">
          <div className="img-topic">
            <img src={(user && user.avatar) ? `${BACKEND_URL}/profile-image/${user.id}` : "./avatar.png"}></img>
            <div className="greeting-text-box">
              <div className="greeting-topic">เพื่อนที่เข้าใจคุณ</div>
              <div className="greeting-text">สนับสนุนและเข้าใจคุณไม่ว่าเมื่อไหร่</div>
            </div>
          </div>
          <div className="select-emotion-box">
            <div className="select-emotion-instr">เลือกวิธีการตอบที่คุณอยากฟัง:</div>
            <div className="select-emotion" id="supporter" onClick={()=>{setEmotionMode("ให้กำลังใจ")}}>❤️ ให้กำลังใจคุณ</div>
            <div className="select-emotion" id="listener" onClick={()=>{setEmotionMode("รับฟัง")}}>👂🏻รับฟังคุณ</div>
            <div className="select-emotion" id="advicer" onClick={()=>{setEmotionMode("ให้คำแนะนำ")}}>👍🏻 ให้ทางออกและคำแนะนำ</div>
          </div>
        </div>
        :
        <></>
        }
        {chat?.map((message, index) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message?.createAt}
          >
            <div className="texts">


              <div className="textRead">
                <div className="beforeText">
                  {(message.senderId === currentUser?.id) && (latestRead <= -2 || latestRead > index) ? <span>อ่านแล้ว</span> : <></>}
                  {/* <span>{format(new Date(message.createdAt))}</span> */}
                </div>

                <p onClick={(e)=>{
                  handleOpenFeedback(e, message.senderId === currentUser?.id)
                }
                  } id={index}>{message.text}</p>
              </div>

              { index == openFeedback ?
                <div className="reactions" >
                  <img id="like" className="feedbacks" src={"./likes.png"} onClick={handleFeedback} />
                  <img id="love" className="feedbacks" src={"./love.png"} onClick={handleFeedback} />
                  <img id="wow" className="feedbacks" src={"./wow.png"} onClick={handleFeedback} />
                  <img id="laugh" className="feedbacks" src={"./laugh.png"} onClick={handleFeedback} />
                  <img id="cry" className="feedbacks" src={"./cry.png"} onClick={handleFeedback} />
                  <img id="angry" className="feedbacks" src={"./angry.png"} onClick={handleFeedback} />

                </div>
                :
                <></>
              }
            </div>
          </div>
        ))}


        {textReady ? <></> : 
        <div class="half light">
          <div class="typing">
            <span class="circle scaling"></span>
            <span class="circle bouncing"></span>
            <span class="circle scaling"></span>
          </div>
        </div>
        }

        <div ref={endRef}></div>
        {/* <div ref={this.messagesEndRef} /> */}
      </div>

      {choosing ? 
      <div class="half"></div>
      :
      <div className="bottom">
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <img
          className="sendButtonImg"
          src="./send.png"
          alt=""
          onClick={handleSend}
        />

      </div>
      }
    </div>
  );
};

export default Chat;
