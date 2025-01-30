import "./addfriend.css";
import { useUserStore } from "../../lib/userStore";
import { LLM_DICT, LLM_LIST } from "../../lib/llm_lists"
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { STATIC_BASE } from "../../lib/config";
import { useState } from "react";

const AddFriend = ( ) => {
  
  const navigate = useNavigate(); 
  const location = useLocation();
  const current_chat_list = location.state;
  const [isSlidingRight, setIsSlidingRight] = useState(false);
  const [isSlidingLeft, setIsSlidingLeft] = useState(false);

  const goback = () =>{ 
    setIsSlidingRight(true);
    setTimeout(() => {
      navigate(`/ChatList`);
    }, 200); // Match the timeout to the animation duration (0.7s)
    
  }
  const gocustom = () =>{ 
    setIsSlidingLeft(true);
    setTimeout(() => {
      navigate(`/Custom`);
    }, 200); // Match the timeout to the animation duration (0.7s)
  }

  const goLLMProfile = async (LLM_info) => {
    setIsSlidingLeft(true);
    setTimeout(() => {
      navigate("/LLMProfile", {state : [LLM_info, location.state]});
    }, 200); // Match the timeout to the animation duration (0.7s)
  };


  const { currentUser } = useUserStore();


  const handleAddLLM = async (e, LLMId) => {
    e.stopPropagation();
    try {
      const res = await axios.get(`/user-info/name/${LLMId}`);
      const llmUser = res.data;
      const newUserChat = {
        userId: currentUser.id,
        receiverId: llmUser.id,
        isSeen: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await axios.post("/user-chats", newUserChat);
      setIsSlidingRight(true);
      setTimeout(() => {
        navigate("/ChatList")
      }, 200); // Match the timeout to the animation duration (0.7s)
      
    } catch (err) {
      console.log(err);
      if (err.response.status === 401) {
        navigate("/Login");
      }
    }
  };

  
  return (
    <div className={`addFriend ${isSlidingRight ? 'slide-right' : (isSlidingLeft ? 'slide-left' : '')}`}>
      <img className="goback" src={`${STATIC_BASE}/arrowLeft.svg`} onClick={goback}/>
      <div className="header_text">
      รายชื่อเพื่อนทั้งหมด
      </div>
      <div className="list_char">
        <button className="item_add" onClick={gocustom}>+ สร้างคาแรกเตอร์สัตว์น้ำของตัวเอง</button>
        {LLM_LIST.map((llm) => (
          <div className="item" onClick={()=>{goLLMProfile(LLM_DICT[llm])}}>
            <img
              src={`${STATIC_BASE}/SeaCharacters/Small-56px/${LLM_DICT[llm].avatar}`}
              className="llm_button"
              id={llm}
              alt=""
            />
            <div className="llm_text" id={llm}>
              <div className="username">{LLM_DICT[llm].username}</div>
              <div className="desc">{LLM_DICT[llm].description}</div>
            </div>
            <button className="button-add" disabled={current_chat_list.includes(LLM_DICT[llm].id)} id={llm} onClick={(e) => handleAddLLM(e, LLM_DICT[llm].id)}>
             {current_chat_list.includes(LLM_DICT[llm].id) ? "เพิ่มแล้ว" : "+ เพิ่ม"}
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default AddFriend;
