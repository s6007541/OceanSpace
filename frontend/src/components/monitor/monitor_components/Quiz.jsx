import React, { useContext } from 'react';
import DataContext from '../monitor_context/dataContext';
import { useEffect, useRef, useState } from "react";
import "./quiz.css";
import { useNavigate } from "react-router-dom";
import { STATIC_BASE } from '../../../lib/config';


const Quiz = () => {
    const navigate = useNavigate(); 
    const [text, setText] = useState("");
    const [selectIndex, setSelectIndex] = useState(null);
    const { showQuiz, question, quizs, selectAnswer,
            selectedAnswer, deselectAnswer, questionIndex, nextQuestion, showTheResult, questionText }  = useContext(DataContext);
    // const { showQuiz, question, quizs, checkAnswer, correctAnswer,
    //         selectedAnswer,questionIndex, nextQuestion, showTheResult }  = useContext(DataContext);
    const goback = () =>{ 
        let path = `/`; 
        navigate(path);
      }
    return (
        <section className="question_section" style={{ display: `${showQuiz ? 'block' : 'none'}` }}>
            <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
            <div className="header_text">แบบทดสอบ</div>
            <div className="progress">{quizs.indexOf(question) + 1} / {quizs?.length}</div>

            <h1 className='question'>{questionText}</h1>
            
            <div className="center">
                <div className="button-group">
                {
                    question?.options?.map((item, index) => 
                    <div className="button-line" onClick={(e) => {
                        selectAnswer(e, index)
                        setSelectIndex(index)
                    }}>
                        <div className="choice_text">{item}</div>
                        
                        {selectIndex === index ?
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="7" fill="white" stroke="#0D7FE8" stroke-width="6"/>
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#D0EBFF"/>
                        </svg>

                        }
                    </div>
                    
                    
                    
                    )
                }
                    <div className="text-input">
                        <textarea rows="4" className="text-area" placeholder={
                                "พิมพ์คำตอบที่นี้แทนการเลือก"
                            }
                            value={text}
                            onChange={(e) => {
                                deselectAnswer()
                                setText(e.target.value)
                                setSelectIndex(-1)
                                }}>
                            onFocus={(e) => {setSelectIndex(-1)}}
                            
                            
                        </textarea>
                        {selectIndex === -1 ?
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="7" fill="white" stroke="#0D7FE8" stroke-width="6"/>
                            </svg>
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="10" fill="#D0EBFF"/>
                            </svg>
                        }
                    </div>
                    
                </div>
                


                {
                    (questionIndex + 1) !== quizs.length ?
                        <button className='nextBtn' onClick={()=>{nextQuestion(text)
                            setSelectIndex(null)
                            setText("")}} disabled={(!(selectedAnswer !== "" || text !== ""))}>ต่อไป</button>
                        :
                        <button className='nextBtn' onClick={()=>{showTheResult(text)
                            setSelectIndex(null)
                            setText("")}} disabled={(!(selectedAnswer !== "" || text !== ""))}>เสร็จสิ้น</button>
                }
            </div>
            
        </section>
        
    );
};

export default Quiz;