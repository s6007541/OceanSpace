from typing import Any, Dict, List

from openai import OpenAI

from .db import Message, User, UserChat
from .schemas import PSSQuestionModel


class LLMClient:
    DEFAULT_GENERATION_KWARGS = {
        "model": "typhoon-instruct",
        "max_tokens": 1000,
        "temperature": 0.6,
        "top_p": 1,
    }

    def __init__(self):
        self.client = OpenAI(
            api_key="sk-GB3lSeMqAzC67gV1crxzcztxMeYatyvWa93VCnpAa7ETkOsG",
            base_url="https://api.opentyphoon.ai/v1",
        )

    def _post_process(self, text: str) -> List[str]:
        return (
            text.rstrip(".")
            .replace(", ", " ")
            .replace(". ", " ")
            .replace(":", "")
            .replace("ครับ", "")
            .replace(" ๆ", "ๆ")
            .split(" ")
        )

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

    def generate_reply(
        self, llm_name: str, user: User, user_chat: UserChat, messages: List[Message]
    ) -> List[str]:
        generated_text = self.generate_text(
            [
                {
                    "role": "system",
                    # content: "คุณคือ ai ชาย ชื่อสีน้ำเงิน ที่คอยรับฟังคนมาระบายความเครียดอย่างอ่อนโยน ถามคำถามบ้างบางครั้งเพื่อให้เขาได้ระบายความในใจ โดยไม่ให้คำแนะนำจนกว่าเขาจะขอเอง",
                    # content: "คุณเป็นผู้ชายที่เป็นเพื่อนของผู้ใช้งานที่คอยรับฟังผู้ใช้งานมาระบายความเครียดให้ฟัง คุณตอบรับด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณถามคำถามบางครั้งเพื่อให้ผู้ใช้งานได้ระบายความในใจ โดยไม่ให้คำแนะนำจนกว่าผู้ใช้งานจะขอเอง คุณตอบรับด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ",
                    # content: `คุณเป็นผู้ชายชื่อ "{llm_name}" ที่เป็นเพื่อนของผู้ใช้งานที่คอยรับฟังผู้ใช้งานมาระบายความเครียดให้ฟัง คุณตอบรับด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณตอบรับสั้น ๆ ด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ`
                    "content": (
                        f'คุณเป็นผู้ชายชื่อ "{llm_name}" ที่เป็นเพื่อนของผู้ใช้งานที่คอยรับฟังผู้ใช้งานมาระบายความเครียดให้ฟัง '
                        "คุณตอบรับด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณตอบรับสั้น ๆ ด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ "
                        "คุณแทนตัวเองด้วยคำว่า 'ผม' และผู้ใช้งานด้วยคำว่า 'คุณ' "
                        "คุณไม่ควรพูดขอโทษหลายครั้งจนเกินไป\n"
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
                    ),
                }
            ]
            + self._prepare_messages(user, messages)
        )
        sentences = self._post_process(generated_text)
        return sentences

    def predict_topics(
        self,
        user: User,
        messages: List[Message],
        topic_list: List[str],
        n_messages: int,
    ) -> List[str]:
        generated_text = self.generate_text(
            messages=[
                {
                    "role": "system",
                    "content": f"คุณจะบอกว่าบทสนทนาเกี่ยวข้องกับเรื่องใดมากที่สุดใน {len(topic_list)} เรื่องดังนี้ : {topic_list}",
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
                    "content": f"บทสนทนาที่ผ่านมาเกี่ยวข้องกับเรื่องใดมากที่สุดใน {len(topic_list)} เรื่องดังนี้ : {topic_list}. ตอบสั้นๆแค่คำตอบ",
                }
            ],
            temperature=0,
        )
        topics = [topic for topic in topic_list if topic in generated_text]
        return topics

    def predict_pss_score(self, pss_question: PSSQuestionModel) -> float:
        generated_text = self.generate_text(
            messages=[
                # {
                #     "role": "system",
                #     "content": "Based on the question : " + question + ", the user will give you the answer. Convert the answer into floating number in scale 1 to 4. Return only float number.",
                # },
                {
                    "role": "user",
                    "content": (
                        f'Based on the question : "{pss_question.question}"\n'
                        f'My answer is : "{pss_question.answer}"\n'
                        'Please give me the score in scale 0 to 4. 0 means "never" and 4 means "very often". '
                        "You can also output -1 if you think the answer is not related to the question. "
                        "Please output only one number, do not explain your answer."
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

    def generate_text(self, messages: Any, **kwargs) -> str:
        stream = self.client.chat.completions.create(
            messages=messages, **(self.DEFAULT_GENERATION_KWARGS | kwargs)
        )
        generated_text = stream.choices[0].message.content
        return generated_text