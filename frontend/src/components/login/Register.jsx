import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { toast } from "react-toastify";
import { BACKEND_URL } from "../../lib/config";
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
      
    // if (!avatar.file) {
    //   setLoading(false);
    //   return toast.warn("Please upload an avatar!");
    // }
      

    // VALIDATE UNIQUE USERNAME
    // const usersRef = collection(db, "users");
    // const q = query(usersRef, where("username", "==", username));
    // const querySnapshot = await getDocs(q);
    // if (!querySnapshot.empty) {
    //   setLoading(false);
    //   return toast.warn("Select another username");
    // }

    // try {
    //   const res = await createUserWithEmailAndPassword(auth, email, password);

    //   const imgUrl = await upload(avatar.file);

    //   await setDoc(doc(db, "users", res.user.uid), {
    //     username,
    //     email,
    //     avatar: imgUrl,
    //     id: res.user.uid,
    //     blocked: [],
    //   });

    //   await setDoc(doc(db, "userchats", res.user.uid), {
    //     chats: [],
    //   });

    //   toast.success("Account created! You can login now!");
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
  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   console.log("login")

  //   const formData = new FormData(e.target);
  //   const { email, password } = Object.fromEntries(formData);

  //   // try {
  //   //   await signInWithEmailAndPassword(auth, email, password);
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

  return (
    <div className="login">
      <div className="item">
        <h2>OCEAN<br/>SPACE</h2>
        <p className="login_text">สมัครสมาชิก</p>
        <form onSubmit={handleRegister}>
          {/* <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          /> */}
          <input type="text" placeholder="อีเมล" name="email" />
          <input type="password" placeholder="รหัสผ่าน" name="password" />
          <button disabled={loading}>{loading ? "กำลังโหลด" : "เข้าสู่ระบบ"}</button>
        </form>
        <div className="bottom">
          <p className="bottom_text">คุณมีสมาชิกอยู่แล้ว?</p>
          <a href="/Login" className="bottom_link">เข้าสู่ระบบ</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
