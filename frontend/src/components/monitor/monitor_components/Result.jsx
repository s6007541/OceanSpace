import "./result.css";
import React, { useContext } from 'react';
import DataContext from '../monitor_context/dataContext';
import Userinfo from "../../list/userInfo/Userinfo";
import Navbar from "../../navbar/Navbar";
import { useNavigate } from "react-router-dom";

const Result = () => {
    const navigate = useNavigate();
    const { showResult, quizs, marks, startOver }  = useContext(DataContext);
    const goback = () =>{ 
        let path = `/ChatList`; 
        // console.log("done");
        navigate(path);
      }
    return (
        
        <section className="results" style={{ display: `${showResult ? 'block' : 'none'}` }}>
            <img className="goback" src="./cross.svg" onClick={goback}/>
            <div className="header_text">แบบทดสอบ</div>
            <div className="container">
                <div className="outer-main-result">
                    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" fill="none">
                        <circle cx="70" cy="70" r="70" fill="#FFA600"/>
                    </svg>
                    <div  className="score">{marks}</div>
                    <div  className="stress-desc">{marks}</div>
                </div>
                <div className="greeting-text">
                

                </div>

            </div>
            


            <div className="container">
                <div className="row vh-100 align-items-center justify-content-center">
                    <div className="col-lg-6">
                        <div className={`text-light text-center p-5 rounded ${marks > (quizs.length * 5 / 2) ? 'bg-success' : 'bg-danger'}`}>
                            {/* <h1 className='mb-2 fw-bold'>{marks > (quizs.length * 5 / 2) ? 'Awesome!' : 'Oops!'}</h1> */}
                            <h3 className='mb-3 fw-bold'>Your score is {marks}</h3>
                            <h3 className='mb-3 fw-bold'>According to Perceived Stress Scale (PSS), your stress level is {(marks >= 0 && marks <= 13) ? "Low Stress" : (marks >= 13 && marks <= 26) ? "Moderate Stress" : "High Stress"}</h3>
                            <p>
                            Individual scores on the PSS can range from 0 to 40 with higher scores indicating higher perceived
                            stress.

                            <ul>
                                <li>Scores ranging from 0-13 would be considered low stress.</li>
                                <li>Scores ranging from 14-26 would be considered moderate stress.</li>
                                <li>Scores ranging from 27-40 would be considered high perceived stress.</li>
                            </ul>

                            The Perceived Stress Scale is interesting and important because your perception of what is happening
                            in your life is most important. Consider the idea that two individuals could have the exact same events
                            and experiences in their lives for the past month. Depending on their perception, total score could put
                            one of those individuals in the low stress category and the total score could put the second person in
                            the high stress category.
                            Disclaimer: The scores on the following self-assessment do not reflect any particular diagnosis or course of treatment.
                            They are meant as a tool to help assess your level of stress. If you have any further concerns about your current well
                            being, you may contact EAP and talk confidentially to one of our specialists.
                            </p>
                            <button onClick={startOver} className='btn py-2 px-4 btn-light fw-bold d-inline'>Start Over</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Result;