import "./supportbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";

const SupportBeach = () => {
  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/`; 
    navigate(path);
  }
  // useEffect(() => {
    
  // }, []);
  return (
    <div className="supportbeach">
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="supportbeach__waves" />
      <div className="supportbeach__sand supportbeach__sand--background" />
      <div className="supportbeach__sand supportbeach__sand--foreground" />
    </div>

  );
};

export default SupportBeach;
