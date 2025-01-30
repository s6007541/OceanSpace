import "./custom.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { STATIC_BASE } from "../../lib/config";
const Custom = ( ) => {

  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/ChatList`; 
    navigate(path);
  }
  const gonext = () =>{ 
    let path = `/Custom`; 
    navigate(path);
  }

  // const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [character, setCharacter] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [deschar, setDeschar] = useState("");
  const [page, setPage] = useState(1);
  const [personalities, setPersonalities] = useState([]);

  const { currentUser } = useUserStore();

  const addremovePersonality = (p) => {
    if (!personalities.includes(p)) {
      setPersonalities([...personalities, p]); // Add new item to the list
    }
    else {
      setPersonalities(personalities.filter((item) => item !== p)); // Remove the item by its value
    }
    
  };

  return (
    <div className="customPage">
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="header_text">
      ตั้งชื่อและโปรไฟล์
      </div>
      {page === 1 ? 
      
      (!image ? 
        <svg className="profile_pic" xmlns="http://www.w3.org/2000/svg" width="152" height="152" viewBox="0 0 152 152" fill="none">
        //   <circle cx="76" cy="76" r="75" fill="#F4FCFF" stroke="#9CD3FC" stroke-width="2" stroke-dasharray="8 8"/>
        //   <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">ภาพโปรไฟล์</text>    
        // </svg> :  
      <img className="profile_pic" src={`${STATIC_BASE}/SeaCharacters/Large-150px/${image}.svg`}/>)
      : <></>}

      {page === 2 || page === 3 ? 
      <div className="profile_pic_wrapper">
        <img className="profile_pic" src={`${STATIC_BASE}/SeaCharacters/Large-150px/${image}.svg`}/> 
        <div className="profile_character">{character}</div>
        <div className="profile_name">{name}</div>
        {desc.length > 0 ? <div className="profile_desc">{desc}</div> : <></>}

        
      </div>
      : <></>}

      { page === 1 ?
      <div className="list_profile">
        <div className="list_profiles_inner">
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Whale.svg`} onClick={()=>setImage("Whale")}/>
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Dolphin.svg`} onClick={()=>setImage("Dolphin")}/>
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Turtle.svg`} onClick={()=>setImage("Turtle")}/>
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Nemo.svg`} onClick={()=>setImage("Nemo")}/>
        </div>
        <div className="list_profiles_inner">
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Seal.svg`}onClick={()=>setImage("Seal")}/>
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Jellyfish.svg`}onClick={()=>setImage("Jellyfish")}/>
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Star.svg`}onClick={()=>setImage("Star")}/>
          <img src={`${STATIC_BASE}/SeaCharacters/Medium-72px/Shark.svg`}onClick={()=>setImage("Shark")}/>
        </div>
      </div>
      : <></>}

      { page === 1 ?

      <div className="tag_outer">
        <div className="tag_inner">
          <button className={character === "พี่สาว" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("พี่สาว")}>พี่สาว</button>
          <button className={character === "พี่ชาย" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("พี่ชาย")}>พี่ชาย</button>
          <button className={character === "พี่กะเทย" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("พี่กะเทย")}>พี่กะเทย</button>
        </div>
        <div className="tag_inner">
          <button className={character === "เพื่อนหญิงพลังหญิง" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("เพื่อนหญิงพลังหญิง")}>เพื่อนหญิงพลังหญิง</button>
          <button className={character === "เพื่อนชายแท้" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("เพื่อนชายแท้")}>เพื่อนชายแท้</button>
        </div>
        <div className="tag_inner">
          <button className={character === "น้องสาว" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("น้องสาว")}>น้องสาว</button>
          <button className={character === "น้องชาย" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("น้องชาย")}>น้องชาย</button>
          <button className={character === "ผู้ใหญ่" ? 'tag clicked' : 'tag'} onClick={()=>setCharacter("ผู้ใหญ่")}>ผู้ใหญ่</button>
        </div>
      </div>
      : <></>}
      { page === 1 ?
      <div className="input_area">
        <input
            type="text"
            placeholder='ชื่อเพื่อน AI'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        <input
            type="text"
            placeholder='Description (Optional)'
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        
      </div>
      : <></>}

      { page === 2 ?

      <div className="tag_outer">
        <div className="tag_inner">
          <button className={(personalities.includes("สนับสนุน")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("สนับสนุน")}>สนับสนุน</button>
          <button className={(personalities.includes("มูเตลู")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("มูเตลู")}>มูเตลู</button>
          <button className={(personalities.includes("ซัพพอร์ต")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("ซัพพอร์ต")}>ซัพพอร์ต</button>
        </div>
        <div className="tag_inner">
          <button className={(personalities.includes("ติดแกลม")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("ติดแกลม")}>ติดแกลม</button>
          <button className={(personalities.includes("มั่นใจในตัวเอง")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("มั่นใจในตัวเอง")}>มั่นใจในตัวเอง</button>
          <button className={(personalities.includes("ขี้เล่น")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("ขี้เล่น")}>ขี้เล่น</button>
        </div>
        <div className="tag_inner">
          <button className={(personalities.includes("สุภาพ")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("สุภาพ")}>สุภาพ</button>
          <button className={(personalities.includes("ใจเย็น")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("ใจเย็น")}>ใจเย็น</button>
          <button className={(personalities.includes("อบอุ่น")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("อบอุ่น")}>อบอุ่น</button>
          <button className={(personalities.includes("มีเหตุผล")) ? 'tag clicked' : 'tag'} onClick={()=>addremovePersonality("มีเหตุผล")}>มีเหตุผล</button>
        </div>
        <div className="input_area page2">
          <input
              type="text"
              placeholder='Description (Optional)'
              value={deschar}
              onChange={(e) => setDeschar(e.target.value)}
            />
        </div>
      </div>
      : <></>}

      <button className="next_button" onClick={()=>{
        if (image === null) {
          toast.error("กรุณาเลือกภาพสัตว์น้ำที่คุณชอบ!")
        }
        else if (character === null) {
          toast.error("กรุณาเลือกบทบาทให้สัตว์น้ำ!")
        }
        else if (name === "") {
          toast.error("กรุณาตั้งชื่อให้สัตว์น้ำ!")
        }
        else if (page === 2) {
          toast.error("This feature is coming soon in a future update. Stay tuned for more!")
        }
        else{
          setPage(page + 1)
        }
      }}>ต่อไป</button>
      

    </div>
  );
};

export default Custom;
