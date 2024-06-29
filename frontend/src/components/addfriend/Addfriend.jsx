import "./addfriend.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { LLM_DICT, LLM_LIST } from "../../lib/llm_lists"
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from "../../lib/config";

const AddFriend = ( ) => {
  
  const navigate = useNavigate(); 
  const location = useLocation();
  const current_chat_list = location.state;

  const goback = () =>{ 
    let path = `/ChatList`; 
    // console.log("done");
    navigate(path);
  }
  const gocustom = () =>{ 
    let path = `/Custom`; 
    // console.log("done");
    navigate(path);
  }

  const goLLMProfile = async (LLM_info) => {
    navigate("/LLMProfile", {state : [LLM_info, location.state]});
    // setAddMode(false);
  };


  const { currentUser } = useUserStore();


  const handleAddLLM = async (LLMId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user-info/name/${LLMId}`, {
        credentials: "include",
      });
      console.log(res)
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
      navigate("/ChatList")
      navigate(0)
    } catch (err) {
      console.log(err);
    }
    // setAddMode(false);
  };

  
  return (
    <div className="addFriend">
      <img className="goback" src="./arrowLeft.svg" onClick={goback}/>
      <div className="header_text">
      รายชื่อเพื่อนทั้งหมด
      </div>
      <div className="list_char">
        <button className="item_add" onClick={gocustom}>+ สร้างคาแรกเตอร์สัตว์น้ำของตัวเอง</button>
        {LLM_LIST.map((llm) => (
          <div className="item" onClick={()=>{goLLMProfile(LLM_DICT[llm])}}>
            <img
              src={`./SeaCharacters/Small-56px/${LLM_DICT[llm].avatar}`}
              className="llm_button"
              id={llm}
              alt=""
            />
            <div className="llm_text" id={llm}>
              <div className="username">{LLM_DICT[llm].username}</div>
              <div className="desc">{LLM_DICT[llm].description}</div>
            </div>
            <button className="button-add" disabled={current_chat_list.includes(LLM_DICT[llm].id)} id={llm} onClick={() => handleAddLLM(LLM_DICT[llm].id)}>
             {current_chat_list.includes(LLM_DICT[llm].id) ? "เพิ่มแล้ว" : "+ เพิ่ม"}
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default AddFriend;
