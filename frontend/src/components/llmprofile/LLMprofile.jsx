import "./llmprofile.css";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { STATIC_BASE } from "../../lib/config";

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
      navigate("/chat")
    } catch (err) {
      console.log(err);
    }
    // setAddMode(false);
  };



  return (
    <div className="llmProfile" style={{background: LLM_info.color}}>
      <img className="goback" src={`${STATIC_BASE}/arrowLeft.svg`} onClick={goback}/>     
      <div className="header_text">{LLM_info.username}</div>
      <img className="profile_pic" src={`${STATIC_BASE}/SeaCharacters/Large-150px/${LLM_info.avatar}`}/> 
      <div className="profile_pic_wrapper">
        <div className="profile_name">{LLM_info.username}</div>
        <div className="profile_desc">{LLM_info.description}</div>
      </div>
      <div className="tag_outer">
        <div className="tag_inner">
          <div className="tag">{LLM_info.tag[0]}</div>
          <div className="tag">{LLM_info.tag[1]}</div>
          <div className="tag">{LLM_info.tag[2]}</div>
        </div>
        <div className="tag_inner">
          <div className="tag">{LLM_info.tag[3]}</div>
          <div className="tag">{LLM_info.tag[4]}</div>
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
