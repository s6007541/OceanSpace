import "./home.css";
import Userinfo from "../list/userInfo/Userinfo";
import Navbar from "../navbar/Navbar";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Home = () => {
  const navigate = useNavigate(); 
  const goChatList = () =>{ 
    let path = `/ChatList`; 
    navigate(path);
  }
  return (
    <div className="home">
      <Userinfo />
      <Navbar />
      <div className="main-content">
        <div className="outer-layer">
          <div className="latest_chat" onClick={goChatList}>
            <img className="character" src={`${STATIC_BASE}/SeaCharacters/Small-56px/Whale.svg`}></img>
            <img className="character" src={`${STATIC_BASE}/SeaCharacters/Small-56px/Dolphin.svg`}></img>
            <div className="latest_chat_text">แชทล่าสุดกับเพื่อนๆ</div>
            <img src={`${STATIC_BASE}/arrow-right.svg`}></img>
          </div>
          <div className="diary-outer">
            <div className="diary-header-wrapper">
              <div className="diary-header">บันทึกประจำวัน</div>
            </div>
      
            <div className="diary-list">
              <div className="diary" onClick={()=>{navigate("/ReliefBeach")}}>
                <div className="emoji">🙂<br/>หาดร้างทุกข์</div>
                <div className="diary-detail">มีเรื่องอะไรอยากให้ ทรายช่วยพัดมั้ย</div>
                <img src={`${STATIC_BASE}/diary1.svg`}/>
              </div>
              <div className="diary" onClick={()=>{navigate("/WishBeach")}}>
                <div className="emoji">⭐<br/>สุขสมหวัง</div>
                <div className="diary-detail">มีเรื่องอะไรอยาก ขอพรกันมั้ย</div>
                <img src={`${STATIC_BASE}/diary2.svg`}/>
              </div>
              {/* <div className="diary" onClick={()=>{navigate("/SupportBeach")}}> */}
              <div className="diary" onClick={()=>{toast.error("This feature is coming soon in a future update. Stay tuned for more!")
}}>
                <div className="emoji">💪🏻<br/>พลังใจ</div>
                <div className="diary-detail">รับจดหมายลับ ให้กำลังใจจากทะเล</div>
                <img src={`${STATIC_BASE}/diary3.svg`}/>
              </div>
            </div>
            <div className="rank-outer">
              <div className="rank-header">
                <div className="rank-topic">อันดับเรื่องที่ระบาย</div>
                <div className="see-all">ดูทั้งหมด</div>
              </div>
              <div className="rank-list">
                <div className="rank-list-elem">
                  <div className="rank-list-first">
                    <div className="rank-number">1</div>
                    <div className="rank-logo">📚</div>
                    <div className="rank-text">การเรียน</div>
                  </div>
                  <div className="rank-percent">45%</div>
                </div>
                <div className="rank-list-elem">
                  <div className="rank-list-first">
                    <div className="rank-number">2</div>
                    <div className="rank-logo">👩🏻‍💻</div>
                    <div className="rank-text">การทำงาน</div>
                  </div>
                  <div className="rank-percent">30%</div>
                </div>
                <div className="rank-list-elem">
                  <div className="rank-list-first">
                    <div className="rank-number">3</div>
                    <div className="rank-logo">💔</div>
                    <div className="rank-text">ความรักที่ไม่สมหวัง</div>
                  </div>
                  <div className="rank-percent">25%</div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      
      </div>

    </div>
  );
};

export default Home;
