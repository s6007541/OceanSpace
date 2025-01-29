import "./supportbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";

const SupportBeach = () => {
  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/`; 
    navigate(path);
  }
  return (
    <div className="supportbeach">
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="supportbeach__waves" />
      <div className="supportbeach__sand supportbeach__sand--background" />
      <div className="supportbeach__sand supportbeach__sand--foreground" />
      {/* <div className="sand" /> */}

    </div>

  );
};

export default SupportBeach;
