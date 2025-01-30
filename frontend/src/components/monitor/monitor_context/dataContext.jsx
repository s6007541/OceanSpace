import { createContext, useState, useEffect } from "react";
import { useUserStore } from "../../../lib/userStore";
import { toast } from "react-toastify";
import axios from "axios";
import { STATIC_BASE } from "../../../lib/config";
import { useNavigate } from "react-router-dom";

const DataContext = createContext({});

export const DataProvider = ({children}) => {
  const navigate = useNavigate();

  // All Quizs, Current Question, Index of Current Question, Answer, Selected Answer, Total Marks
  const [quizs, setQuizs] = useState([]);
  // const quizs = data;
  const [question, setQuestion] = useState({});
  const [questionText, setQuestionText] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [marks, setMarks] = useState(0);

  // Display Controlling States
  const [showStart, setShowStart] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const [topicOfInterest, setTopicOfInterest] = useState(["original"]);

  const { updateCurrentUserInfo } = useUserStore();

  function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
  }
  
  // Load JSON Data
  useEffect(() => {
    fetch(`${STATIC_BASE}/quiz.json`)
      .then(res => res.json())
      .then(data => {
        setQuizs(data)
      })
  }, []);
  
  // fetch('quiz.json').then(res => res.json()).then(data => setQuizs(data))

  // Set a Single Question
  useEffect(() => {
    if (quizs.length > questionIndex) { // if not overflow
      setQuestion(quizs[questionIndex]);
      const chosen_topic = quizs[questionIndex][choose(topicOfInterest)];
      setQuestionText(choose(chosen_topic));
    }
  }, [quizs, questionIndex])

  // Start Quiz
  const startQuiz = async () => {
    setShowStart(false);
    setShowQuiz(true);
    setTopicOfInterest(["original"]);

    // get topic of interest
    try {
      const res = await axios.get("/user-chats");
      const userChats = res.data;

      const topicsOfInterest = userChats.map((userChat) => userChat.topicsOfInterest)

      setTopicOfInterest((topicsOfInterest).flat().concat(["original"]));
      
    } catch (err) {
      console.log(err);
      if (err.response.status === 401) {
        navigate("/Login");
      }
    }
      
  }

  // Check Answer
  // const checkAnswer = (event, selected) => {
  //   if (!selectedAnswer) {
  //     setCorrectAnswer(question.answer);
  //     setSelectedAnswer(selected);

  //     if (selected === question.answer) {
  //       event.target.classList.add('bg-success');
  //       setMarks(marks + 5);
  //     } else {
  //       event.target.classList.add('bg-danger');
  //     }
  //   }
  // }

  // select ans
  const selectAnswer = (event, selected) => {
    setSelectedAnswer(selected);
  }

  const deselectAnswer = (event, selected) => {
    setSelectedAnswer("");
  }

  // Next Quesion
  const nextQuestion = async (text) => {

    setShowResult(false);
    setShowStart(false);
    setShowQuiz(false);
    setShowLoading(true);

    var score
    if (selectedAnswer === "") {
      // get pss score from llm
      try {
        const res = await axios.post("/pss", {
          question: questionText,
          answer: text,
        });
        score = res.data.pss;
        if (score === -1) {
          setShowResult(false);
          setShowStart(false);
          setShowQuiz(true);
          setShowLoading(false);
          setSelectedAnswer('');
          toast.error("โอ๊ะ! คำตอบนี้ดูไม่ค่อยตรงกับคำถามเท่าไหร่เลยนะ 😅 ลองตอบใหม่แล้วเพิ่มรายละเอียดอีกนิดนะครับ 🌟")
          return
        }
      } catch (err) {
        console.log(err);
        if (err.response.status === 401) {
          navigate("/Login");
        }
      }
    } else {
      score = selectedAnswer;
    }
    if (question.reverse == true){
      score = 4-score
    }
    setMarks(marks + score)

    setShowQuiz(true);
    setShowLoading(false);
    
    // setCorrectAnswer('');
    setSelectedAnswer('');
    // const wrongBtn = document.querySelector('button.bg-danger');
    // wrongBtn?.classList.remove('bg-danger');
    // const rightBtn = document.querySelector('button.bg-success');
    // rightBtn?.classList.remove('bg-success');
    setQuestionIndex(questionIndex + 1);
  }

  // Show Result
  const showTheResult = async (text) => {

    setShowResult(false);
    setShowStart(false);
    setShowQuiz(false);
    setShowLoading(true);

    var score;
    if (selectedAnswer === ""){
      // get pss score from llm
      try {
        const res = await axios.post("/pss", {
          question: questionText,
          answer: text,
        });
        score = res.data.pss;
        if (score === -1) {
          setShowResult(false);
          setShowStart(false);
          setShowQuiz(true);
          setShowLoading(false);
          setSelectedAnswer('');
          toast.error("โอ๊ะ! คำตอบนี้ดูไม่ค่อยตรงกับคำถามเท่าไหร่เลยนะ 😅 ลองตอบใหม่แล้วเพิ่มรายละเอียดอีกนิดนะครับ 🌟")
          return
        }
      } catch (err) {
        console.log(err);
        if (err.response.status === 401) {
          navigate("/Login");
        }
      }
    }
    else{
      score = selectedAnswer
    }
    if (question.reverse == true){
      score = 4-score
    }
    setMarks(marks + score);

    setShowResult(true);
    setShowStart(false);
    setShowQuiz(false);
    setShowLoading(false);
    
    const final_score = marks + score;

    // save final score
    await updateCurrentUserInfo({ pss: final_score });
  }

  // Start Over
  const startOver = () => {
    setShowStart(false);
    setShowResult(false);
    setShowQuiz(true);
    // setCorrectAnswer('');
    setSelectedAnswer('');
    setQuestionIndex(0);
    setMarks(0);
    // const wrongBtn = document.querySelector('button.bg-danger');
    // wrongBtn?.classList.remove('bg-danger');
    // const rightBtn = document.querySelector('button.bg-success');
    // rightBtn?.classList.remove('bg-success');
  }
    return (
        <DataContext.Provider value={{
            startQuiz,showStart,showQuiz,question,quizs,
            selectedAnswer,questionIndex,nextQuestion,showTheResult,showResult,marks,
            startOver, selectAnswer, deselectAnswer, showLoading, questionText
            // checkAnswer, correctAnswer
        }} >
            {children}
        </DataContext.Provider>
    );
}

export default DataContext;

