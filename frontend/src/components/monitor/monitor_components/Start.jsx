import React, { useContext } from 'react';
import DataContext from '../monitor_context/dataContext';
import "./start.css";
import Userinfo from "../../list/userInfo/Userinfo";
import Navbar from "../../navbar/Navbar";

const Start = () => {
    const {startQuiz, showStart} = useContext(DataContext);
    return (
        showStart ? 
            
            <div className="start">
                <Userinfo />
                <Navbar />
                <div className="main-test">
                    <div className="header-body">
                        <div className='header'>วัดความเครียด</div>
                        <div className='body'>
                            <img className='background-img' src="./pss_start_bg.svg"></img>
                            <img className='body-image' src="./whale_nobg.svg"></img>
                            <div className='body_text'>
                                <div className='quote'>“</div>
                                <div className='texts'>พวกเราควรทำแบบทดสอบ<br/>วัดระดับความเครียดเดือนละ 1 ครั้ง</div>
                                <div className='quote'>”</div>
                            </div>
                        </div>
                    </div>
                    <button onClick={startQuiz} className="start-button">เริ่มทำแบบทดสอบ</button>
                </div>
                
            </div>
             : 
             <>
             </>
            
    );
};

export default Start;