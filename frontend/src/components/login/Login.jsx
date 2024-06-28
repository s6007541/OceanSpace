import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { BACKEND_URL } from "../../lib/config";
import { useNavigate } from "react-router-dom";
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from "firebase/auth";
// import { auth, db } from "../../lib/firebase";
// import {
//   arrayUnion,
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   serverTimestamp,
//   setDoc,
//   updateDoc,
//   where,
// } from "firebase/firestore";

// import upload from "../../lib/upload";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

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

  // const handleRegister = async (e) => {
  //   console.log("register")
  //   e.preventDefault();
  //   setLoading(true);
  //   const formData = new FormData(e.target);

  //   const { username, email, password } = Object.fromEntries(formData);

  //   // VALIDATE INPUTS
  //   if (!username || !email || !password){
  //     setLoading(false);
  //     return toast.warn("Please enter inputs!");
  //   }
      
  //   if (!avatar.file) {
  //     setLoading(false);
  //     return toast.warn("Please upload an avatar!");
  //   }
      

  //   // VALIDATE UNIQUE USERNAME
  //   // const usersRef = collection(db, "users");
  //   // const q = query(usersRef, where("username", "==", username));
  //   // const querySnapshot = await getDocs(q);
  //   // if (!querySnapshot.empty) {
  //   //   setLoading(false);
  //   //   return toast.warn("Select another username");
  //   // }

  //   // try {
  //   //   const res = await createUserWithEmailAndPassword(auth, email, password);

  //   //   const imgUrl = await upload(avatar.file);

  //   //   await setDoc(doc(db, "users", res.user.uid), {
  //   //     username,
  //   //     email,
  //   //     avatar: imgUrl,
  //   //     id: res.user.uid,
  //   //     blocked: [],
  //   //   });

  //   //   await setDoc(doc(db, "userchats", res.user.uid), {
  //   //     chats: [],
  //   //   });

  //   //   toast.success("Account created! You can login now!");
  //   // } catch (err) {
  //   //   console.log(err);
  //   //   toast.error(err.message);
  //   //   // setLoading(false);
  //   // } finally {
  //   //   setLoading(false);
  //   //   console.log(loading)
  //   // }
  //   setLoading(false)
  // };
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
      });
      if (!res.ok) {
        throw new Error("Cannot log in");
      }
      navigate("/");
    } catch (err) {
      console.log(err);
      toast.error("ไม่สามารถเข้าสู่ระบบได้");
    } finally {
      setLoading(false);
    }

    // try {
    //   await signInWithEmailAndPassword(auth, email, password);
    // } catch (err) {
    //   console.log(err);
    //   toast.error(err.message);
    //   // setLoading(false);
    // } finally {
    //   setLoading(false);
    //   console.log(loading)
    // }
    // setLoading(false)
  };

  return (
    <div className="login">
      <div className="item">
      <h2>OCEAN<br/>SPACE</h2>
      <p className="login_text">เข้าสู่ระบบ</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="อีเมล" name="username" />
          <input type="password" placeholder="รหัสผ่าน" name="password" />
          <button disabled={loading}>{loading ? "กำลังโหลด" : "เข้าสู่ระบบ"}</button>
        </form>
        <div className="bottom">
          <p className="bottom_text">ยังไม่เคยลงทะเบียน?</p>
          <a href="/Signup" className="bottom_link">ลงทะเบียน</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
