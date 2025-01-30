import "./supportbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";

const FloatingImage = ({ imageSrc }) => {
  const [randidx, setRandidx] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const imageRef = useRef(null);
  const [showUnrolling, setShowUnrolling] = useState(false); // State for GIF visibility
  const supportive_text = ["ทุกความพยายามมีคุณค่า ไม่มีความล้มเหลวที่ไม่สอนอะไรเราเลย สู้ต่อไปนะ!" 
                        ,"แม้วันนี้จะยาก แต่พรุ่งนี้อาจเป็นวันที่สดใสที่สุด รักษาความหวังและมุ่งมั่นไว้!" 
                        ,"ทุกครั้งที่เธอก้าวข้ามอุปสรรค เธอเติบโตขึ้น และนั่นทำให้เธอแข็งแกร่งขึ้นกว่าที่เคย" 
                        ,"ความสำเร็จไม่ได้เกิดจากการไม่เคยล้มเหลว แต่เกิดจากการลุกขึ้นสู้ทุกครั้งที่ล้ม" 
                        ,"อย่าลืมว่าการพยายามในวันนี้ จะนำพาเธอไปสู่ความสำเร็จในวันหน้า มุ่งมั่นต่อไป!" 
                        ,"ช่วงเวลาที่ยากที่สุดมักจะนำไปสู่ช่วงเวลาที่ดีที่สุดของชีวิต" 
                        ,"ไม่ว่าจะยากแค่ไหน ถ้าใจเธอยังไม่ถอดใจ เธอจะผ่านมันไปได้" 
                        ,"ทุกก้าวเล็กๆ ที่เดินไปข้างหน้า นำเธอไปใกล้ความฝันมากขึ้นเรื่อยๆ" 
                        ,"ความสำเร็จไม่ใช่เรื่องของความเร็ว แต่เป็นเรื่องของความตั้งใจและความพยายาม" 
                        ,"จำไว้เสมอว่าเธอมีพลังในตัวเองมากกว่าที่เธอคิด อย่ายอมแพ้นะ!"]
  useEffect(() => {
    setRandidx(Math.floor(Math.random() * supportive_text.length));
    const maxX = window.innerWidth - (imageRef.current?.width || 50);
    const maxY = window.innerHeight;

    setX((Math.random() * maxX * 0.8) + (0.1 * maxX));
    const y_ = (Math.random() * maxY * 0.5) + 30
    setY(y_);

    setRotation(Math.random() * 60 - 30);

    const img = new Image();
    img.onload = () => {
      const originalHeight = 100;

      // Calculate rotated height (approximation)
      const radians = Math.abs(rotation) * Math.PI / 180;
      const rotatedHeight = originalHeight * Math.cos(radians) + img.width * Math.sin(radians);

      const minCropHeight = rotatedHeight * 0.5; // 40% of rotated height
      const maxCropHeight = rotatedHeight * 0.9; // 60% of rotated height

      setCropHeight(Math.random() * (maxCropHeight - minCropHeight) + minCropHeight);
    };
    img.src = imageSrc;


    const float = () => {
      const amplitude = Math.random() * 20 + 10;
      const frequency = 1/6;

      let startTime = null;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const timeElapsed = (currentTime - startTime) / 1000;

        const offsetY = Math.sin(timeElapsed * frequency * 2 * Math.PI) * amplitude;
        setY(y_ + offsetY);

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    float();
  }, []);

  const handleClick = () => {
    setShowUnrolling(true); // Show the GIF
    setIsVisible(false); // Hide the bottle
  };
  
  return (
      <div className="floating-object-outer">
        {isVisible ? 
        <div
          className="floating-bottle"
          style={{
            position: 'absolute',
            top: 0,
            left: x,
            transform: `translateY(${y}px) rotate(${rotation}deg)`,
            width: 'auto',
            height: cropHeight,
            overflow: 'hidden',
          }}>
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Floating Image"
            onClick={handleClick}
            style={{
              // width: '100%',
              height: '100px',
              display: 'block',
            }}/>
        </div> : <></>}


        <img
        src={`${STATIC_BASE}/paper-scroll.png`}
        className={`magic-scroll ${showUnrolling ? "visible" : ""}`}/>

        <div className={`paper-scroll-text ${showUnrolling ? "visible" : ""}`}>{supportive_text[randidx]}</div>
        
      </div>
  );
};

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
      <FloatingImage key={0} imageSrc={`${STATIC_BASE}/bottle1.webp`} />
    </div>

  );
};

export default SupportBeach;
