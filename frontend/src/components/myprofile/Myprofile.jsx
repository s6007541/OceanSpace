import "./myprofile.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { useNavigate } from "react-router-dom";

const Myprofile = ( ) => {
  const { resetChat } = useChatStore();

  const navigate = useNavigate(); 
  const goback = () =>{
    let path = `/ChatList`; 
    navigate(path);
  }

  const [user, setUser] = useState(null);
  const [text, setText] = useState(null);
  const [notiOpen, setNotiOpen] = useState(true);

  const { currentUser } = useUserStore();
  
  const handleLogout = () => {
    // auth.signOut(); // need to fix this
    resetChat()
    navigate('/login', { replace: true });
  };

  return (
    <div className="myProfile">
      <img className="goback" src="./cross.svg" onClick={goback}/>
      <div className="header_text">หน้าของฉัน</div>
      <div className="profile_pic_wrapper">
        <img className="profile_pic" src={`./userprofile_default.svg`}/> 
        <div className="profile-edit">แก้ไข</div>
        {/* <div className="profile_name">{currentUser.username}</div> */}
      </div>

      <div className="option">
        <div className="setting">
          <div className="setting-header">ตั้งค่า</div>
          <div className="setting-button">
          <div className="setting-button-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#D9D9D9"/>
            </svg>
            ข้อมูลส่วนตัว
            </div>
          </div>
          <div className="setting-button">
            <div className="setting-button-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#D9D9D9"/>
              </svg>
              การแจ้งเตือน
            </div>
            <button onClick={()=>setNotiOpen((e)=>!e)} style={{background: notiOpen ? "var(--OceanSpace-Brand-Primary, #0D7FE8)" : "var(--OceanSpace-Brand-Primary, #e80d0d)"}}>{notiOpen ? "เปิด" : "ปิด"}</button>
          </div>
          <div className="setting-button">
            <div className="setting-button-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#D9D9D9"/>
              </svg>
              เบอร์ติดต่อฉุกเฉิน
            </div>
            <input
              type="text"
              placeholder="เบอร์โทรศัพท์"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="setting-button">
            <div className="setting-button-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#D9D9D9"/>
              </svg>
              นโยบายความเป็นส่วนตัว
            </div>
          </div>
        </div>

        <div className="signout" onClick={handleLogout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="#D9D9D9"/>
          </svg>
          ออกจากระบบ
        </div>
      </div>


    </div>
  );
};

export default Myprofile;
