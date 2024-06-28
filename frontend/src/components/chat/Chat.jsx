import { useEffect, useRef, useState } from "react";
import "./chat.css";
import { toast } from "react-toastify";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import { LLM_LIST } from "../../lib/llm_lists";
import { useNavigate } from "react-router-dom";

// TODO import socket
// TODO import backend_url


const Chat = () => {
  const navigate = useNavigate(); 
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [openFeedback, setOpenFeedback] = useState(-1);
  const [startWait, setStartWait] = useState(true);
  const [latestRead, setLatestRead] = useState(-3);
  const [textReady, setTextReady] = useState(true);
  const [checkpoint, setCheckpoint] = useState(20);

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

  // useEffect(() => {
  //   async function fetchMessages() {
      
  //   }

  //   fetchMessages();
  // }, [chatData]);

  // TODO use effect socket


  const handleBack = async (e) => {
    // TODO
    navigate("/ChatList")
    resetChat();
  };

  
  const handleOpenFeedback = (e, isOwn) => {
    console.log(isOwn)
    if (!isOwn) {
      setOpenFeedback((old_id) => (old_id === e.target.id ? -1 : e.target.id));
      console.log(openFeedback);
    }
    
  };

  const handleFeedback = async (e) => {

  };

  const handleSend = async () => {
   
  };

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img
            className="goback"
            src="./arrowLeft.png"
            alt=""
            onClick={handleBack}
          />
          <img
            className="userimg"
            src="./avatar.png"
            alt=""
            onClick={setDetail}
          />
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>

      </div>
      <div className="center">
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
    </div>
  );
};

export default Chat;
