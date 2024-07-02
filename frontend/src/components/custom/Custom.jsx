import "./custom.css";
import { useState } from "react";
import { useUserStore } from "../../lib/userStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const Custom = ( ) => {

  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/chat`; 
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
  const [page, setPage] = useState(1);

  const { currentUser } = useUserStore();
  console.log(image)

  return (
    <div className="customPage">
      <img className="goback" src="./cross.svg" onClick={goback}/>
      <div className="header_text">
      ตั้งชื่อและโปรไฟล์
      </div>
      {page === 1 ? 
      <svg className="profile_pic" xmlns="http://www.w3.org/2000/svg" width="152" height="152" viewBox="0 0 152 152" fill="none">
        <circle cx="76" cy="76" r="75" fill="#F4FCFF" stroke="#9CD3FC" stroke-width="2" stroke-dasharray="8 8"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">ภาพโปรไฟล์</text>    
      </svg> : <></>}
      {page === 2 || page === 3 ? 
      <div className="profile_pic_wrapper">
        <img className="profile_pic" src={`./SeaCharacters/Large-150px/${image}.svg`}/> 
        <div className="profile_character">{character}</div>
        <div className="profile_name">{name}</div>
        {desc.length > 0 ? <div className="profile_desc">{desc}</div> : <></>}

        
      </div>
      : <></>}

      { page === 1 ?
      <div className="list_profile">
        <div className="list_profiles_inner">
          <img src="./SeaCharacters/Medium-72px/Whale.svg" onClick={()=>setImage("Whale")}/>
          <img src="./SeaCharacters/Medium-72px/Dolphin.svg" onClick={()=>setImage("Dolphin")}/>
          <img src="./SeaCharacters/Medium-72px/Turtle.svg" onClick={()=>setImage("Turtle")}/>
          <img src="./SeaCharacters/Medium-72px/Nemo.svg" onClick={()=>setImage("Nemo")}/>
        </div>
        <div className="list_profiles_inner">
          <img src="./SeaCharacters/Medium-72px/Seal.svg"onClick={()=>setImage("Seal")}/>
          <img src="./SeaCharacters/Medium-72px/Jellyfish.svg"onClick={()=>setImage("Jellyfish")}/>
          <img src="./SeaCharacters/Medium-72px/Star.svg"onClick={()=>setImage("Star")}/>
          <img src="./SeaCharacters/Medium-72px/Shark.svg"onClick={()=>setImage("Shark")}/>
        </div>
      </div>
      : <></>}

      { page === 1 ?

      <div className="tag_outer">
        <div className="tag_inner">
          <button className="tag" onClick={()=>setCharacter("พี่สาว")}>พี่สาว</button>
          <button className="tag" onClick={()=>setCharacter("พี่ชาย")}>พี่ชาย</button>
          <button className="tag" onClick={()=>setCharacter("พี่กะเทย")}>พี่กะเทย</button>
        </div>
        <div className="tag_inner">
          <button className="tag" onClick={()=>setCharacter("เพื่อนหญิงพลังหญิง")}>เพื่อนหญิงพลังหญิง</button>
          <button className="tag" onClick={()=>setCharacter("เพื่อนชายแท้")}>เพื่อนชายแท้</button>
        </div>
        <div className="tag_inner">
          <button className="tag" onClick={()=>setCharacter("น้องสาว")}>น้องสาว</button>
          <button className="tag" onClick={()=>setCharacter("น้องชาย")}>น้องชาย</button>
          <button className="tag" onClick={()=>setCharacter("ผู้ใหญ่")}>ผู้ใหญ่</button>
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
          <button className="tag" onClick={()=>setCharacter("สนับสนุน")}>สนับสนุน</button>
          <button className="tag" onClick={()=>setCharacter("มูเตลู")}>มูเตลู</button>
          <button className="tag" onClick={()=>setCharacter("ซัพพอร์ต")}>ซัพพอร์ต</button>
        </div>
        <div className="tag_inner">
          <button className="tag" onClick={()=>setCharacter("ติดแกลม")}>ติดแกลม</button>
          <button className="tag" onClick={()=>setCharacter("มั่นใจในตัวเอง")}>มั่นใจในตัวเอง</button>
          <button className="tag" onClick={()=>setCharacter("ขี้เล่น")}>ขี้เล่น</button>
        </div>
        <div className="tag_inner">
          <button className="tag" onClick={()=>setCharacter("สุภาพ")}>สุภาพ</button>
          <button className="tag" onClick={()=>setCharacter("ใจเย็น")}>ใจเย็น</button>
          <button className="tag" onClick={()=>setCharacter("อบอุ่น")}>อบอุ่น</button>
          <button className="tag" onClick={()=>setCharacter("มีเหตุผล")}>มีเหตุผล</button>
        </div>
      </div>
      : <></>}

      <button className="next_button" onClick={()=>{
        navigate("/")
        toast.error("โปรดจ่ายเงินเพื่อ unlock feature")

      }}>ต่อไป</button>
      

    </div>
  );
};

export default Custom;
