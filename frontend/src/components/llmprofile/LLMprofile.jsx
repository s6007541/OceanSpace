import "./llmprofile.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { LLM_DICT, LLM_LIST } from "../../lib/llm_lists"
import { BACKEND_URL } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';

const LLMprofile = ( ) => {
  const { resetChat } = useChatStore();

  const navigate = useNavigate(); 
  const location = useLocation();
  // console.log(location)
  const [LLM_info, current_chat_list] = location.state;
  console.log(LLM_info)
  console.log(current_chat_list)
  // console.log(current_chat_list.includes(LLM_info.id))
  const { currentUser } = useUserStore();
  const goback = () =>{
    let path = `/chat`; 
    // console.log("done");
    navigate(path);
  }

  const addLineBreak = (str) =>
    str.split('\n').map((subStr) => {
      return (
        <>
          {subStr}
          <br />
        </>
      );
    });

  const handleAddLLM = async (LLMId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user-info/name/${LLMId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user info");
      }
      const llmUser = await res.json();
      const newUserChat = {
        userId: currentUser.id,
        receiverId: llmUser.id,
        isSeen: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await fetch(`${BACKEND_URL}/user-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserChat),
        credentials: "include",
      });
      navigate("/chat")
    } catch (err) {
      console.log(err);
    }
    // setAddMode(false);
  };



  return (
    <div className="llmProfile" style={{background: LLM_info.color}}>
      <img className="goback" src="./arrowLeft.svg" onClick={goback}/>     
      <div className="header_text">{LLM_info.username}</div>
      <img className="profile_pic" src={`./SeaCharacters/Large-150px/${LLM_info.avatar}`}/> 
      <div className="profile_pic_wrapper">
        <div className="profile_name">{LLM_info.username}</div>
        <div className="profile_desc">{LLM_info.description}</div>
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

      <div className="greet">
        <div className="quote">“</div>
        <div className="greet_text">{addLineBreak(LLM_info.greeting_message)}</div>
        <div className="quote">”</div>
      </div>
      <button className="add-button" disabled={current_chat_list.includes(LLM_info.id)} style={{
        color: `var(--OceanSpace-Brand-Secondary, ${LLM_info.color})`,
        background: current_chat_list.includes(LLM_info.id) ? "rgba(255, 255, 255, 0.50)" : "#FFF"
        }}
        onClick={()=>{handleAddLLM(LLM_info.id)}}
        >
        {current_chat_list.includes(LLM_info.id) ? 
        `เพิ่ม${LLM_info.role} “${LLM_info.username}” แล้ว` : 
        `+ เพิ่ม${LLM_info.role} “${LLM_info.username}”`
        }
      </button>

    </div>
  );
};

export default LLMprofile;
