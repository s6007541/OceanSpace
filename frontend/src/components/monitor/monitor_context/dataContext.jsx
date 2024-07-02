import { createContext, useState, useEffect } from "react";
import { useUserStore } from "../../../lib/userStore";
import { BACKEND_URL } from "../../../lib/config";
import { toast } from "react-toastify";

const DataContext = createContext({});

export const DataProvider = ({children}) => {
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
    fetch('quiz.json')
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
      console.log(topicOfInterest);
      const chosen_topic = quizs[questionIndex][choose(topicOfInterest)];
      // console.log(chosen_topic);
      // console.log(choose(chosen_topic));
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
      const res = await fetch(`${BACKEND_URL}/user-chats`, {credentials: "include"});
      const userChats = await res.json();

      const topicsOfInterest = userChats.map((userChat) => userChat.topicsOfInterest)

      // console.log(userChats)
      // console.log((userChatsData.chats[0].topic_of_interest))
      // console.log((userChatsData.chats.map((e)=>e.topic_of_interest)))
      setTopicOfInterest((topicsOfInterest).flat().concat(["original"]));
      
    } catch (err) {
      console.log(err);
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
    console.log(text)
    console.log(selectedAnswer)

    setShowResult(false);
    setShowStart(false);
    setShowQuiz(false);
    setShowLoading(true);

    var score
    if (selectedAnswer === "") {
      // get pss score from llm
      try {
        const res = await fetch(`${BACKEND_URL}/pss`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: questionText,
            answer: text
          }),
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to get pss score");
        }
        const data = await res.json();
        score = data.pss;
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
        console.log(err)
      }
    } else {
      score = selectedAnswer;
    }
    if (question.reverse == true){
      score = 4-score
    }
    setMarks(marks + score)
    console.log(score)
    console.log(marks)

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
    // to do, save text + selectedAnswer
    console.log(text)
    console.log(selectedAnswer)

    setShowResult(false);
    setShowStart(false);
    setShowQuiz(false);
    setShowLoading(true);

    var score;
    if (selectedAnswer === ""){
      // get pss score from llm
      try {
        const res = await fetch(`${BACKEND_URL}/pss`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: questionText,
            answer: text
          }),
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to get pss score");
        }
        const data = await res.json();
        score = data.pss;
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
        console.log(err)
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

