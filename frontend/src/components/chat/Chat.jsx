import { useEffect, useRef, useState } from "react";
import "./chat.css";
import { toast } from "react-toastify";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { useSocket } from "../../lib/socket";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL, STATIC_BASE } from "../../lib/config";
import axios from "axios";
import { getTimezone } from "../../lib/timezone";
import { LLM_DICT, LLM_LIST } from "../../lib/llm_lists"

const Chat = () => {
  const navigate = useNavigate(); 
  
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isSlidingRight, setIsSlidingRight] = useState(false);

  const [showSelfHarm, setShowSelfHarm] = useState(false);
  const [harmOthers, setHarmOthers] = useState(false);
  const [isFloatingDown, setIsFloatingDown] = useState(false);

  const [openFeedback, setOpenFeedback] = useState(-1);
  const [startWait, setStartWait] = useState(true);
  const [latestRead, setLatestRead] = useState(-3);

  const [textReady, setTextReady] = useState(true);
  const [newTextArrive, setnewTextArrive] = useState(false);

  const [checkpoint, setCheckpoint] = useState(20);
  const [emotionMode, setEmotionMode] = useState("");
  const [numUnreadMessage, setNumUnreadMessage] = useState(0);
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

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      await handleSend();
    }
  };

  // Function to request fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement; // Get the entire document (html)

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
      elem.msRequestFullscreen();
    }
  };

  // Function to exit fullscreen
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
      document.msExitFullscreen();
    }
  };

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollTop = endRef.current.scrollHeight; // Scroll to the bottom
    }
    enterFullscreen();

  }, []);

  useEffect(() => {
    async function fetchMessages() {
      if (chatId === null) {
        
        navigate("/ChatList", { replace: true });
        return;
      }
      try {
        const res = await axios.get(`/messages/${chatId}`);
        const messages = res.data;
        chatRef.current = messages;
        setChat([...chatRef.current]);
      } catch (err) {
        console.log(err);
      }
    }

    fetchMessages();
  }, [chatData]);

  useEffect(() => {
    async function update_unreadMessages() {
      try {
        const res = await axios.get(`/user-chats/${chatId}`);
        const userChat = res.data;
        userChat.unreadMessages = 0;
        await axios.put("/user-chats", userChat);
      } catch (err) {
        console.log(err);
      }
    }

    if (!socket || socketHandledRef.current) {
      return;
    }
    socketHandledRef.current = true;
    socket.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        update_unreadMessages()
        chatRef.current.push(data.data);
        setChat([...chatRef.current]);
      } else if (data.type === "message-done") {
        console.log("socket")
        console.log(textReady)
        if (!newTextArrive) {
          setTextReady(true); // bubble stop
        }
        setLatestRead(chatRef.current.length);
      } else if (data.type === "checkpoint") {
        console.log("Topic of interest: ", data.data)
      } else if (data.type === "sec-detection") {
        console.log(data.data)
        if (data?.data?.pred === "self-harm") {
          // toast.error("self-harm")
          setShowSelfHarm(true);
          setIsFloatingDown(false);
        }
        else if (data?.data?.pred === "harm others") {
          // toast.error("harm-others")
          setHarmOthers(true);
          setIsFloatingDown(false);
        }
      }
    });
  }, [socket]);


  const handleBack = async (e) => {
    try {
      const res = await axios.get(`/user-chats/${chatId}`);
      const userChat = res.data;
      userChat.unreadMessages = 0;
      await axios.put("/user-chats", userChat);
    } catch (err) {
      console.log(err);
    }
    // Trigger the floating down animation
    setIsSlidingRight(true);
    // Wait for the animation to finish before hiding the component
    setTimeout(() => {
      navigate("/ChatList");
      resetChat();
      exitFullscreen();
    }, 200); // Match the timeout to the animation duration (0.7s)
    
  };

  
  const handleOpenFeedback = (e, isOwn) => {
    if (!isOwn) {
      setOpenFeedback((old_id) => (old_id === e.target.id ? -1 : e.target.id));
    }
  };

  const handleFeedback = async (e) => {
    try{
      const res = await axios.get(`/user-chats/${chatId}`);
      const userChat = res.data;
      if (e.target.id === "angry") {
        userChat.blacklist.push(chatRef.current[openFeedback].text);
      } else {
        userChat.whitelist.push(chatRef.current[openFeedback].text);
      }
      await axios.put("/user-chats", userChat);
      setOpenFeedback(-1);
      toast.success(`Feedback has been received! "${user.username}" will enhance the response according to your suggestions.`);
    } catch (err){
      console.log(err);
    }
  };

  const handleSend = async () => {
    enterFullscreen();
    if (latestRead === -3) {
      setLatestRead(chatRef.current.length);
    }
    
    if (text === "") return;

    try {
      const message = {
        chatId: chatId,
        senderId: currentUser.id,
        createdAt: Date.now(),
        timezone: getTimezone(),
        text: text,
        buffer: true,
        emotionMode: "",
        persuasive: false,
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

      setTimeout(()=>{
        console.log("time3")
        console.log(textReady)
        if (!textReady) { // if not first time
          setnewTextArrive(true);
        }
        else {
          setnewTextArrive(false);
        }
        setTextReady(false); //bubble start
        setLatestRead(-2); //read all
      }, 2000);

      setTimeout(async () => {
        console.log("time6")
        setStartWait(true); // next message will be save to next chunk

        const message = {
          chatId: chatId,
          senderId: user.id,
          createdAt: Date.now(),
          timezone: getTimezone(),
          text: "",
          buffer: false,
          emotionMode : emotionMode,
          persuasive: false,
          // persuasive : harmOthers || setEmotionMode
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
            timezone: getTimezone(),
            text: "",
            buffer: false,
            emotionMode: "",
            persuasive: false,
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

  const handleSelectEmotion = (e) => {
    setChoosing(!choosing)
    console.log(choosing)
  };

  const handleCloseHarm = () => {
    // Trigger the floating down animation
    setIsFloatingDown(true);
    // Wait for the animation to finish before hiding the component
    setTimeout(() => {
      setShowSelfHarm(false);
    }, 700); // Match the timeout to the animation duration (0.7s)
  };

  console.log(user);
  // console.log(LLM_DICT[user.alias]);


  return (
    <div className={`chat ${isSlidingRight ? 'slide-right' : ''}`}>
      {showSelfHarm ? 
      <div className={`self-harm ${isFloatingDown ? 'float-down' : ''}`}>
        <div className="img-wrap">
          <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={handleCloseHarm}/>
        </div>
        <div className="divout">
          <img className="harm_logo" src={`${STATIC_BASE}/harm_logo.svg`}/>
          <div className="upper-text">
            <div className="topic">ข้อความเตือนเกี่ยวกับการทำร้ายตนเอง</div>
            <div className="detail1">{"สวัสดี :)"}<br/>คุณดูเหมือนจะกำลังเผชิญกับความเครียดที่หนักมาก <br/>และเราเข้าใจว่าบางครั้งการระบายความรู้สึก<br/>อาจทำให้คุณรู้สึกดีขึ้น</div>
            <div className="detail2">
              อย่างไรก็ตามเราได้ตรวจพบข้อความ<br/>
              ที่อาจสื่อถึงการทำร้ายตนเอง<br/>
              หากคุณรู้สึกว่าต้องการความช่วยเหลือด่วน<br/>
              เราขอแนะนำให้คุณติดต่อคนที่คุณไว้ใจ<br/>
              หรือผู้เชี่ยวชาญด้านสุขภาพจิตทันทีนะคะ</div>
            
          </div>
          <div className="call">
            สายด่วนสุขภาพจิต 1323<br/>
            สายด่วนสมาคมจิตแพทย์ 1667
          </div>
          <div className="ending">คุณไม่จำเป็นต้องเผชิญเรื่องนี้เพียงลำพัง เราอยู่ที่นี่เพื่อรับฟังและให้กำลังใจคุณค่ะ</div>

        </div>
        

      </div>
      :
      <></>}
      <div className="top">
        <div className="user">
          <svg className="goback" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" onClick={handleBack}>
            <path d="M12.7071 19.7071C12.3166 20.0976 11.6834 20.0976 11.2929 19.7071L4.29289 12.7071C3.90237 12.3166 3.90237 11.6834 4.29289 11.2929L11.2929 4.29289C11.6834 3.90237 12.3166 3.90237 12.7071 4.29289C13.0976 4.68342 13.0976 5.31658 12.7071 5.70711L7.41421 11L19 11C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13L7.41421 13L12.7071 18.2929C13.0976 18.6834 13.0976 19.3166 12.7071 19.7071Z" fill="black"/>
          </svg>
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>
        <div className="button-select-emotion" onClick={handleSelectEmotion}>
          <div className="button-text" >{emotionMode === "" ? "เลือก" : emotionMode}</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
            <path d="M1.99305 5.41996C1.66638 5.74663 1.66638 6.27329 1.99305 6.59996L7.53305 12.14C7.79305 12.4 8.21305 12.4 8.47305 12.14L14.013 6.59996C14.3397 6.27329 14.3397 5.74663 14.013 5.41996C13.6864 5.09329 13.1597 5.09329 12.833 5.41996L7.99971 10.2466L3.16638 5.41329C2.84638 5.0933 2.31305 5.09329 1.99305 5.41996Z" fill="#0D7FE8"/>
          </svg>
        </div>
      </div>

      
      <div className="center" onClick={enterFullscreen} ref={endRef}> 
        {chat?.length === 0 ? 
        <div className="chat-greeting">
          <div className="img-topic">
            {/* <img src={(user && user.avatar) ? `${BACKEND_URL}/profile-image/${user.id}` : `${STATIC_BASE}/avatar.png`}></img> */}
            <img src={(user && user.avatar) ? `${STATIC_BASE}/nobg_${LLM_DICT[user.alias].avatar}` : `${STATIC_BASE}/avatar.png`}></img>
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
                <div className={`reactions animated-reactions`}>
                  <img id="like" className="feedbacks" src={`${STATIC_BASE}/likes.png`} onClick={handleFeedback} />
                  <img id="love" className="feedbacks" src={`${STATIC_BASE}/love.png`} onClick={handleFeedback} />
                  <img id="wow" className="feedbacks" src={`${STATIC_BASE}/wow.png`} onClick={handleFeedback} />
                  <img id="laugh" className="feedbacks" src={`${STATIC_BASE}/laugh.png`} onClick={handleFeedback} />
                  <img id="cry" className="feedbacks" src={`${STATIC_BASE}/cry.png`} onClick={handleFeedback} />
                  <img id="angry" className="feedbacks" src={`${STATIC_BASE}/angry.png`} onClick={handleFeedback} />

                </div>
                :
                <></>
              }
            </div>
          </div>
        ))}


        {textReady || showSelfHarm ? <></> : 
        <div class="half light">
          <div class="typing">
            <span class="circle scaling"></span>
            <span class="circle bouncing"></span>
            <span class="circle scaling"></span>
          </div>
        </div>
        }

        
        {/* <div ref={this.messagesEndRef} /> */}
      </div>

      {choosing ? 
      <div className="bottom-emotion-bar">
        <div className="bottom-emotion-top-bar">เลือกวิธีการตอบที่คุณอยากฟัง:</div>
        <div className="bottom-emotion-select-list">
          <div className="bottom-emotion-select" onClick={()=>{
            setEmotionMode("ให้กำลังใจ")
            setChoosing(false)}}>
            <div className="first-bottom-emotion">❤️ ให้กำลังใจคุณ</div>
            {emotionMode === "ให้กำลังใจ" ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clip-path="url(#clip0_672_4921)">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" fill="#0D7FE8"/>
              </g>
              <defs>
              <clipPath id="clip0_672_4921">
              <rect width="24" height="24" fill="white"/>
              </clipPath>
              </defs>
            </svg>
            :
            <></>}
            
          </div>
          <div className="bottom-emotion-select" onClick={()=>{
            setEmotionMode("รับฟัง")
            setChoosing(false)}}>
            <div className="first-bottom-emotion">👂🏻 รับฟังคุณ</div>
            {emotionMode === "รับฟัง" ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clip-path="url(#clip0_672_4921)">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" fill="#0D7FE8"/>
              </g>
              <defs>
              <clipPath id="clip0_672_4921">
              <rect width="24" height="24" fill="white"/>
              </clipPath>
              </defs>
            </svg>
            :
            <></>}
            
          </div>
          <div className="bottom-emotion-select" onClick={()=>{
            setEmotionMode("ให้คำแนะนำ")
            setChoosing(false)}}>
            <div className="first-bottom-emotion">👍🏻 ให้ทางออกและคำแนะนำ</div>
            {emotionMode === "ให้คำแนะนำ" ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clip-path="url(#clip0_672_4921)">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" fill="#0D7FE8"/>
              </g>
              <defs>
              <clipPath id="clip0_672_4921">
              <rect width="24" height="24" fill="white"/>
              </clipPath>
              </defs>
            </svg>
            :
            <></>}
          </div>
        </div>
      </div>
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
          onKeyDown={handleKeyDown}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
          onClick={exitFullscreen}
        />
        <div className="emoji">
          <img
            src={`${STATIC_BASE}/emoji.png`}
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <img
          className="sendButtonImg"
          src={`${STATIC_BASE}/send.png`}
          alt=""
          onClick={handleSend}
        />

      </div>
      }
    </div>
  );
};

export default Chat;
