import "./result.css";
import React, { useContext } from 'react';
import DataContext from '../monitor_context/dataContext';
import Userinfo from "../../list/userInfo/Userinfo";
import { useNavigate } from "react-router-dom";
import { STATIC_BASE } from "../../../lib/config";

const Result = () => {
    const navigate = useNavigate();
    const { showResult, quizs, marks, startOver }  = useContext(DataContext);
    const goback = () =>{ 
        let path = `/`; 
        navigate(path);
      }
    if (!showResult) {
        return <></>
    }
    return (
        
        <div className="results">
            <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
            <div className="header_text">ผลแบบทดสอบ</div>
            <div className="resultscontainer">
                <div className="outer-main-result">
                    <div className="score-outer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" fill="none">
                            <circle cx="70" cy="70" r="70" fill="#FFA600"/>
                        </svg>
                        <div  className="score">{marks}</div>
                    </div>
                    <div className="stress-outer">
                        <div  className="stress-desc">{(marks >= 0 && marks <= 13) ? "ความเครียดต่ำ" : (marks >= 13 && marks <= 26) ? "ความเครียดปานกลาง" : "ความเครียดสูง"}</div>
                        <div  className="range-outer">
                            <div className="range">
                                <div className="range-value">0-13</div>
                                <div className="range-desc">ต่ำ</div>
                            </div>
                            <div className="range">
                                <div className="range-value">14-26</div>
                                <div className="range-desc">ปานกลาง</div>
                            </div>
                            <div className="range">
                                <div className="range-value">27-40</div>
                                <div className="range-desc">สูง</div>
                            </div>
                        </div>
                    </div>
                    
                </div>
                <img className='background-img' src={`${STATIC_BASE}/pss_end_greeting.svg`}/>

            </div>
            

        </div>
    );
};

export default Result;