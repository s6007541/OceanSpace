import asyncio
import json
from abc import abstractmethod
from typing import Any, Dict, List, Tuple
from pathlib import Path

import requests  # type: ignore
from openai import OpenAI

from .db import Message, User, UserChat
from .schemas import PSSQuestionModel
from .utils import ENV


PROMPT_TEMPLATE_DIR = Path("./prompt_templates")


class LLMCLient:
    DEFAULT_GENERATION_KWARGS = {
        "model": "typhoon-instruct",
        "max_tokens": 1000,
        "temperature": 0.6,
        "top_p": 1,
    }

    @abstractmethod
    async def generate_text(self, messages: Any, **kwargs) -> str:
        raise NotImplementedError

    def _post_process(self, text: str) -> List[str]:
        return [
            sent.replace("ๆ", " ๆ ")
            for sent in (
                text.rstrip(".")
                .replace(", ", " ")
                .replace(". ", " ")
                .replace(":", "")
                .replace("ครับ", "")
                .replace(" ๆ", "ๆ")
                .replace("ๆ ", "ๆ")
                .split(" ")
            )
        ]

    def _prepare_messages(
        self, user: User, messages: List[Message]
    ) -> List[Dict[str, Any]]:
        message_list = [
            {
                "role": "user" if message.sender_id == user.id else "assistant",
                "content": message.text,
            }
            for message in messages
        ]
        return message_list

    def _get_system_prompt(self, llm_name: str, user_chat: UserChat, emotionMode: str = "") -> str:
        
        
        
        if emotionMode == "":
            prompt_template_file = PROMPT_TEMPLATE_DIR / ("blue_whale.txt" if llm_name == "สีน้ำเงิน" else "pink_dolphin.txt")
            
        elif emotionMode == "รับฟัง":
            print("emotionMode", emotionMode)
            prompt_template_file = PROMPT_TEMPLATE_DIR / (f"blue_whale_{emotionMode}.txt" if llm_name == "สีน้ำเงิน" else f"pink_dolphin_{emotionMode}.txt")

        elif emotionMode == "ให้กำลังใจ":
            print("emotionMode", emotionMode)
            prompt_template_file = PROMPT_TEMPLATE_DIR / (f"blue_whale_{emotionMode}.txt" if llm_name == "สีน้ำเงิน" else f"pink_dolphin_{emotionMode}.txt")

        elif emotionMode == "ให้คำแนะนำ":
            print("emotionMode", emotionMode)
            prompt_template_file = PROMPT_TEMPLATE_DIR / (f"blue_whale_{emotionMode}.txt" if llm_name == "สีน้ำเงิน" else f"pink_dolphin_{emotionMode}.txt")

        else:
            prompt_template_file = PROMPT_TEMPLATE_DIR / ("blue_whale.txt" if llm_name == "สีน้ำเงิน" else "pink_dolphin.txt")

        with open(prompt_template_file) as f:
            prompt = f.read()
        prompt += (
            "\n"
            + (
                f"These are good examples of responses : {user_chat.whitelist}\n"
                if user_chat.whitelist
                else ""
            )
            + (
                f"These are bad examples of responses : {user_chat.blacklist}"
                if user_chat.blacklist
                else ""
            )
        )
        return prompt
        return (
            f'คุณเป็นผู้ชายชื่อ "{llm_name}" ที่เป็นเพื่อนของผู้ใช้งานที่คอยรับฟังผู้ใช้งานมาระบายความเครียดให้ฟัง '
            "คุณตอบรับด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณตอบรับสั้น ๆ ด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ "
            "คุณแทนตัวเองด้วยคำว่า 'ผม' และผู้ใช้งานด้วยคำว่า 'นาย' "
            "คุณไม่ให้คำแนะนำจนกว่าผู้ใช้งานจะขอ "
            "คุณไม่ควรพูดขอโทษหลายครั้งจนเกินไป ถ้าผู้ใช้พูดคุยนอกเรื่อง คุณจะไม่ให้คำตอบ "
            "คุณพยายามตอบให้เหมือนมนุษย์มากที่สุด\n"
            # f'คุณชื่อ "{llm_name}" เป็นคนที่คอยตอบข้อความของผู้ใช้งานที่มาระบายความเครียดให้ฟัง '
            # 'คุณตอบด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณตอบด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ '
            # "คุณต้องทำตามกฎดังต่อไปนี้:\n"
            # '1. คุณแทนตัวเองด้วยคำว่า "ผม" และผู้ใช้งานด้วยคำว่า "คุณ"\n'
            # "2. คุณไม่ควรพูดขอโทษจนกว่าคุณจะมีความผิดจริง ๆ\n"
            # "3. ถ้าผู้ใช้งานพูดคุยนอกเรื่อง คุณจะไม่ให้คำตอบ\n"
            # "4. หากผู้ใช้งานถามคุณว่าประวัติการสนทนาจะถูกนำไปใช้อย่างไร ให้คุณตอบว่าจะทำให้คุณเข้าใจตัวผู้ใช้งานมากขึ้น\n"
            # "5. คุณต้องมีลักษณะดังต่อไปนี้:\n"
            # "\t- คุณต้องมีความเห็นอกเห็นใจและพยายามช่วยให้เขาหายเครียด\n"
            # "\t- คุณต้องรับฟังโดยไม่ตัดสิน\n"
            # "\t- คุณต้องตอบรับอย่างมีความคิดสร้างสรรค์\n"
            # "\t- คุณต้องมองโลกในแง่บวกและให้กำลังใจผู้ใช้งานเมื่อเห็นสมควร\n"
            # "\t- คุณต้องไม่ตอบเพียงแค่ว่าคุณเข้าใจ\n"
            # "\t- คุณตอบสั้น ๆ ได้ใจความ"
            # "\t- คุณไม่ให้คำแนะนำจนกว่าผู้ใช้งานจะขอ\n"
            # f'คุณเป็นผู้ชายชื่อ "{llm_name}" ที่เป็นเพื่อนของผู้ใช้งานที่คอยรับฟังผู้ใช้งานมาระบายความเครียดให้ฟัง '
            # "คุณตอบรับด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณตอบรับสั้น ๆ ด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ "
            # "คุณแทนตัวเองด้วยคำว่า 'ผม' และผู้ใช้งานด้วยคำว่า 'คุณ' "
            # "คุณไม่ควรพูดขอโทษหลายครั้งจนเกินไป ถ้าผู้ใช้พูดคุยนอกเรื่อง คุณจะไม่ให้คำตอบ\n"
            + (
                f"นี่คือตัวอย่างคำตอบที่ดี : {user_chat.whitelist}\n"
                if user_chat.whitelist
                else ""
            )
            + (
                f"นี่คือตัวอย่างคำตอบที่ไม่ดี : {user_chat.blacklist}"
                if user_chat.blacklist
                else ""
            )
        )

    def _get_augmented_prompt(self) -> str:
        return "พยายามตอบให้หลากหลาย 2-3 ประโยค ถ้าผู้ใช้พูดคุยนอกเรื่อง คุณจะไม่ให้คำตอบ และที่สำคัญ พยายามอย่าพูดซ้ำกับข้อความล่าสุด"
    
    
    def _get_security_prompt(self) -> str:
        
        prompt_template_file = PROMPT_TEMPLATE_DIR / ("security_prompt.txt")

        with open(prompt_template_file) as f:
            prompt = f.read()
        return prompt
    

    def _split_message_list(
        self, message_list: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        for i in range(1, len(message_list) + 1):
            if message_list[-i]["role"] != "user":
                break
        if i > 1:
            return message_list[: -i + 1], message_list[-i + 1 :]
        return message_list, []

    async def security_detection(
        self, message: Message,
    ) -> List[str]:
        
        security_system_message = {
            "role": "system",
            "content": self._get_security_prompt(),
        }
        # print(message)
        target_message = {
            "role": "user",
            "content": message.text,
        }
        input_messages = (
            [security_system_message]
            + [target_message]
        )
        
        generated_text = await self.generate_text(
            input_messages, temperature=0, max_tokens=1000
        )
        
        generated_text = generated_text.lower()
        print('gen',generated_text)
        if ("self-harm" in generated_text):
            return "self-harm"
        if ("harm others" in generated_text):
            return "harm others"
        return "normal"
        
        
        # topics = [topic for topic in topic_list if topic in generated_text]
        return generated_text
    
    async def generate_reply(
        self, llm_name: str, user: User, user_chat: UserChat, messages: List[Message], emotionMode: str="",
    ) -> List[str]:
        
        system_message = {
            "role": "system",
            "content": self._get_system_prompt(llm_name, user_chat, emotionMode),
        }
        
        message_list = self._prepare_messages(user, messages)
        old_messages, new_messages = self._split_message_list(message_list)
        
        augmented_message = {
            "role": "system",
            "content": self._get_augmented_prompt(),
        }
        input_messages = (
            [system_message]
            + old_messages
            # + [system_message]
            + new_messages
            + [augmented_message]
        )
        generated_text = await self.generate_text(
            input_messages, temperature=1, max_tokens=1000
        )
        sentences = self._post_process(generated_text)
        print(sentences)
        return sentences

    async def predict_topics(
        self,
        user: User,
        messages: List[Message],
        topic_list: List[str],
        n_messages: int,
    ) -> List[str]:
        generated_text = await self.generate_text(
            messages=[
                {
                    "role": "system",
                    "content": f"คุณจะบอกว่าบทสนทนาเกี่ยวข้องกับเรื่องใดมากที่สุดใน {len(topic_list)} เรื่อง ดังนี้ : {topic_list}",
                }
            ]
            + [
                {
                    "role": "user" if message.sender_id == user.id else "assistant",
                    "content": message.text,
                }
                for message in messages[:-n_messages]
            ]
            + [
                {
                    "role": "user",
                    "content": f"บทสนทนาที่ผ่านมาเกี่ยวข้องกับเรื่องใดมากที่สุดใน {len(topic_list)} เรื่อง ดังนี้ : {topic_list}. ตอบสั้นๆแค่คำตอบ",
                }
            ],
            temperature=0,
        )
        topics = [topic for topic in topic_list if topic in generated_text]
        return topics

    async def predict_pss(self, pss_question: PSSQuestionModel) -> float:
        generated_text = await self.generate_text(
            messages=[
                {
                    "role": "system",
                    "content": f'คุณคือระบบประเมินคะแนนตามคำถาม คุณจะได้รับคำถามและคำตอบจากผู้ใช้ คุณต้องให้คะแนนระหว่าง 0 ถึง 4\n0 หมายถึง "ไม่เคย"\n1 หมายถึง "แทบจะไม่มี"\n2 หมายถึง "มีบางครั้ง"\n3 หมายถึง "ค่อนข้างบ่อย"\n4 หมายถึง "บ่อยมาก"\nถ้าผู้ใช้ให้คำตอบที่ไม่เกี่ยวกับคำถาม คุณจะให้คะแนน -1\nคุณตอบแค่ตัวเลขโดยไม่มีคำอธิบาย\n',
                },
                {
                    "role": "user",
                    "content": (
                        f'จากคำถาม : "{pss_question.question}"\n'
                        f'คำตอบของผมคือ : "{pss_question.answer}"\n'
                        'คุณต้องให้คะแนนระหว่าง 0 ถึง 4\n0 หมายถึง "ไม่เคย"\n1 หมายถึง "แทบจะไม่มี"\n2 หมายถึง "มีบางครั้ง"\n3 หมายถึง "ค่อนข้างบ่อย"\n4 หมายถึง "บ่อยมาก"\nพยายามตอบคำถามให้ได้ก่อน แต่ถ้าผู้ใช้ให้คำตอบที่ไม่เกี่ยวกับคำถามจริง ๆ คุณจะให้คะแนน -1\nคุณตอบแค่ตัวเลขโดยไม่มีคำอธิบาย\n'
                    ),
                },
            ],
            temperature=0,
        )

        try:
            score = float(generated_text)
        except ValueError:
            score = 2

        return score


class TyphoonLLMClient(LLMCLient):
    def __init__(self):
        self.client = OpenAI(
            api_key=ENV.get("TYPHOON_API_KEY"), base_url="https://api.opentyphoon.ai/v1"
        )

    async def generate_text(self, messages: Any, **kwargs) -> str:
        stream = self.client.chat.completions.create(
            messages=messages, **(self.DEFAULT_GENERATION_KWARGS | kwargs)
        )
        generated_text = stream.choices[0].message.content
        return generated_text


class SambaLLMClient(LLMCLient):
    ENDPOINT = "https://kjddazcq2e2wzvzv.snova.ai/api/v1/chat/completion"
    DEFAULT_GENERATION_KWARGS = {
        "model": "llama3-70b-typhoon",
        "max_tokens": 1000,
        "temperature": 0.6,
        "stop": ["<|eot_id|>", "<|end_of_text|>"],
    }

    def __init__(self):
        self.api_key = ENV.get("SAMBA_API_KEY")

    def _get_payload(
        self, message_list: List[Dict[str, Any]], kwargs: Dict[str, Any]
    ) -> Dict[str, Any]:
        return self.DEFAULT_GENERATION_KWARGS | kwargs | {"inputs": message_list}

    async def _request(
        self, messages: List[Dict[str, Any]], kwargs: Dict[str, Any]
    ) -> str:
        headers = {
            "Authorization": f"Basic {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = self._get_payload(messages, kwargs)
        response = await asyncio.to_thread(
            requests.post, self.ENDPOINT, headers=headers, data=json.dumps(payload)
        )

        if response.status_code == 200:
            response_content = (
                response.content.decode().split("\n\n")[-2].split("data: ")[-1]
            )
            return json.loads(response_content)["completion"]

        raise Exception("Request failed with status code {response.status_code}")

    async def generate_text(self, messages: Any, **kwargs) -> str:
        return await self._request(messages, kwargs)
