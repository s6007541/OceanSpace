import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../lib/userStore";
import axios from "axios";
import { useAuth } from "../provider/AuthProvider";
import { STATIC_BASE } from "../../lib/config";
import { useError } from "../../lib/error";


// import upload from "../../lib/upload";

const Login = () => {
  // const [avatar, setAvatar] = useState({
  //   file: null,
  //   url: "",
  // });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchCurrentUserInfo } = useUserStore();
  const { setToken } = useAuth();
  const { error_messages } = useError();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("login")

    const formData = new FormData(e.target);
    const { username, password } = Object.fromEntries(formData);
    try {
      const res = await axios.post(
        "/auth/jwt/login",
        new URLSearchParams({ username, password }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      setToken(res.data.access_token);
      await fetchCurrentUserInfo();
      setLoading(false);
      navigate("/ChatList");
      navigate(0);
    } catch (err) {
      console.log(err);
      let error_msg = "ไม่สามารถเข้าสู่ระบบได้";
      if (error_messages) {
        let error_code = err.response?.data?.detail.code;
        if (!error_code) {
          error_code = err.response?.data?.detail;
        }
        const new_error_msg = error_messages[error_code];
        if (new_error_msg) {
          error_msg = new_error_msg;
        }
      }
      toast.error(error_msg);
      setLoading(false);
    }
  };

  const handleContinueWithGoogle = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.get("/auth/google/authorize");
      window.location.href = res.data.authorization_url;
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
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
          <img src={`${STATIC_BASE}/google.png`}/>
          <div className="google-text" onClick={handleContinueWithGoogle}>Continue with Google</div>
        </div>
      </div>

    </div>
  );
};

export default Login;
