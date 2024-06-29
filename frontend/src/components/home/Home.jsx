import { useEffect, useRef, useState } from "react";
import "./home.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import Userinfo from "../list/userInfo/Userinfo";
import Navbar from "../navbar/Navbar";
const Home = () => {

  return (
    <div className="home">
      <Userinfo />
      <Navbar />
      <div className="main-content">
        <div className="outer-layer">
          <div className="latest_chat">
            <img src='./dolphin.svg'></img>
            <div className="latest_chat_text">แชทล่าสุดกับเพื่อนสาว “สีชมพู”</div>
            <img src='./arrow-right.svg'></img>
          </div>
          <div className="diary-outer">
            <div className="diary-header-wrapper">
              <div className="diary-header">บันทึก of the day</div>
            </div>

            <div className="diary-list">
              <div className="diary">
                <div className="emoji">🙂<br/>หาดร้างทุกข์</div>
                <div className="diary-detail">มีเรื่องอะไรอยากให้ ทรายช่วยพัดมั้ย</div>
                <img src='./diary1.svg'/>
              </div>
              <div className="diary">
                <div className="emoji">⭐<br/>สุขสมหวัง</div>
                <div className="diary-detail">มีเรื่องอะไรอยาก ขอพรกันมั้ย</div>
                <img src='./diary2.svg'/>
              </div>
              <div className="diary">
                <div className="emoji">💪🏻<br/>พลังใจ</div>
                <div className="diary-detail">รับจดหมายลับ ให้กำลังใจจากทะเล</div>
                <img src='./diary3.svg'/>
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


     {/* <a href="/">home</a> */}
     {/* <a href="/ChatList">ChatList</a>
     <a href="/Chat">Chat</a>
     <a href="/Monitor">Monitor</a>
     <a href="/Login">login</a>
     <a href="/Signup">signup</a>
     <a href="/AddFriend">AddFriend</a>
     <a href="/Custom">Custom</a>
     <a href="/myprofile">myprofile</a>
     <a href="/llmprofile">llmprofile</a> */}


    </div>
  );
};

export default Home;
