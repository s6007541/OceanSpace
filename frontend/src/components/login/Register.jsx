import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { toast } from "react-toastify";
import { BACKEND_URL } from "../../lib/config";


// import upload from "../../lib/upload";

const Register = () => {
  // const [avatar, setAvatar] = useState({
  //   file: null,
  //   url: "",
  // });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // const handleAvatar = (e) => {
  //   if (e.target.files[0]) {
  //     setAvatar({
  //       file: e.target.files[0],
  //       // url: URL.createObjectURL(e.target.files[0]),
  //     });
  //   }
  // };

  const handleRegister = async (e) => {
    console.log("register")
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const { email, password } = Object.fromEntries(formData);

    // VALIDATE INPUTS
    if (!email || !password){
      setLoading(false);
      return toast.warn("Please enter inputs!");
    }

    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("ไม่สามารถลงทะเบียนได้!");
      }

      toast.success("ลงทะเบียนสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว");
      navigate("/login")
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }
      
  return (
    <div className="login">
      <div className="item">
        <h2>OCEAN<br/>SPACE</h2>
        <form onSubmit={handleRegister}>
          {/* <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          /> */}
          <p className="login_text">สมัครสมาชิก</p>
          <input type="text" placeholder="อีเมล" name="email" />
          <input type="password" placeholder="รหัสผ่าน" name="password" />
          <button disabled={loading}>{loading ? "กำลังโหลด" : "ลงทะเบียน"}</button>
        </form>
        
        <div className="bottom">
          <p className="bottom_text">คุณมีสมาชิกอยู่แล้ว?</p>
          <a href="/Login" className="bottom_link">เข้าสู่ระบบ</a>
        </div>
        <div on-bar-outer>
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="139" height="1" viewBox="0 0 139 1" fill="none">
            <path d="M1 0.5H138" stroke="white" stroke-opacity="0.5" stroke-linecap="round"/>
          </svg> */}
          <div className="line-bar"></div>
          <div className="or-bar">หรือ</div>
          <div className="line-bar"></div>

          {/* <svg xmlns="http://www.w3.org/2000/svg" width="139" height="1" viewBox="0 0 139 1" fill="none">
            <path d="M1 0.5H138" stroke="white" stroke-opacity="0.5" stroke-linecap="round"/>
          </svg> */}
        </div>
        <div className="signin-google-outer">
          <img src="./google.png"/>
          <div className="google-text">Continue with Google</div>
        </div>
        
      </div>
    </div>
  );
};

export default Register;
