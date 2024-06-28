import React, { useContext } from 'react';
import DataContext from '../monitor_context/dataContext';
import { useEffect, useRef, useState } from "react";
import "./loading.css";
import Userinfo from "../../list/userInfo/Userinfo";
import Navbar from "../../navbar/Navbar";

const Loading = () => {
    const { showLoading }  = useContext(DataContext);
    // const { showQuiz, question, quizs, checkAnswer, correctAnswer,
    //         selectedAnswer,questionIndex, nextQuestion, showTheResult }  = useContext(DataContext);

    return (
        <section className="loading_section" style={{ display: `${showLoading ? 'block' : 'none'}` }}>
            <div className="loading">Oceanspace is diving into your story!"</div>
        </section>
        
    );
};

export default Loading;