import "./addfriend.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { LLM_DICT, LLM_LIST } from "../../lib/llm_lists"
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';

const AddFriend = ( ) => {
  
  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/`; 
    navigate(path);
  }
  const gocustom = () =>{ 
    let path = `/Custom`; 
    navigate(path);
  }

  const goLLMProfile = async (LLM_info) => {
    navigate("/llmprofile", {state : [LLM_info, location.state]});
  };


  const { currentUser } = useUserStore();

  const handleAddLLM = async (LLMId) => {
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
            <button className="button-add">
             เพิ่มแล้ว
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default AddFriend;
