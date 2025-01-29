import "./reliefbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";

const ReliefBeach = () => {
  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/`; 
    navigate(path);
  }
  return (
    <div className="beach">
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="beach__waves" />
      <div className="beach__sand beach__sand--background" />
      <div className="beach__sand beach__sand--foreground" />
      {/* <div className="sand" /> */}

    </div>

  );
};

export default ReliefBeach;
