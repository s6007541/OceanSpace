import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { BACKEND_URL } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../lib/userStore";


// import upload from "../../lib/upload";

const Login = () => {
  // const [avatar, setAvatar] = useState({
  //   file: null,
  //   url: "",
  // });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchCurrentUserInfo } = useUserStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("login")

    const formData = new FormData(e.target);
    const { username, password } = Object.fromEntries(formData);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, password }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Cannot log in");
      }
      await fetchCurrentUserInfo();
      setLoading(false);
      navigate("/ChatList");
      navigate(0);
    } catch (err) {
      console.log(err);
      toast.error("ไม่สามารถเข้าสู่ระบบได้");
      setLoading(false);
    }

  };

  return (
    <div className="login">
      <div className="item">
        <h2>OCEAN<br/>SPACE</h2>
        
        <form onSubmit={handleLogin}>
          <p className="login_text">เข้าสู่ระบบ</p>  
          <input type="text" placeholder="อีเมล" name="username" />
          <input type="password" placeholder="รหัสผ่าน" name="password" />
          <button disabled={loading}>{loading ? "กำลังโหลด" : "เข้าสู่ระบบ"}</button>
        </form>
        <div className="bottom">
          <p className="bottom_text">ยังไม่เคยลงทะเบียน?</p>
          <a href="/Signup" className="bottom_link">ลงทะเบียน</a>
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

export default Login;
