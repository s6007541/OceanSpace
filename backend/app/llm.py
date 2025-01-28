import asyncio
import json
from abc import abstractmethod
from typing import (
    Any,
    AsyncGenerator,
    AsyncIterator,
    Dict,
    List,
    Optional,
    Tuple,
)
from pathlib import Path

import backoff
import requests  # type: ignore
import google.generativeai as genai  # type: ignore
from google.api_core.exceptions import ResourceExhausted as GoogleRateLimitError
from google.generativeai.types import content_types  # type: ignore
from openai import AsyncOpenAI, RateLimitError as OpenAIRateLimitError
from openai.types.chat import ChatCompletion
from pythainlp import sent_tokenize

from .db import Message, User, UserChat
from .schemas import PSSQuestionModel
from .utils.config import ENV
from .utils.key_manager import APIKeyManager


PROMPT_TEMPLATE_DIR = Path("./prompt_templates")


class LLMClient:
    DEFAULT_GENERATION_KWARGS = {
        "max_tokens": 1000,
        "temperature": 0.6,
        "top_p": 1,
    }

    @abstractmethod
    def generate_text(
        self, messages: Any, stream: bool = False, **kwargs
    ) -> AsyncIterator[str]:
        raise NotImplementedError()

    async def generate_text_raw(
        self, messages: Any, stream: bool = False, **kwargs
    ) -> str:
        return "".join(
            [
                text
                async for text in self.generate_text(messages, stream=stream, **kwargs)
            ]
        )

    def _post_process(self, text: str) -> List[str]:
        def reformat(s: str) -> str:
            return (
                s.rstrip(".")
                .replace(", ", " ")
                .replace(". ", " ")
                .replace(":", "")
                .replace("ครับ", "")
                .replace(" ๆ", "ๆ")
                .replace("ๆ ", "ๆ")
            )

        def split(s: str, method: str = "whitespace") -> List[str]:
            if method == "whitespace":
                return s.split(" ")
            elif method == "crfcut":
                return sent_tokenize(s, engine="crfcut")
            raise NotImplementedError()

        sentences = [
            sent.replace("ๆ", " ๆ ").rstrip()
            for sent in split(reformat(text), "crfcut")
        ]
        return [sent for sent in sentences if sent]

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

    def _get_system_prompt(
        self, llm_name: str, user_chat: UserChat, emotionMode: str = ""
    ) -> str:

        if emotionMode == "":
            prompt_template_file = PROMPT_TEMPLATE_DIR / (
                "blue_whale.txt" if llm_name == "สีน้ำเงิน" else "pink_dolphin.txt"
            )

        elif emotionMode == "รับฟัง":
            print("emotionMode", emotionMode)
            prompt_template_file = PROMPT_TEMPLATE_DIR / (
                f"blue_whale_{emotionMode}.txt"
                if llm_name == "สีน้ำเงิน"
                else f"pink_dolphin_{emotionMode}.txt"
            )

        elif emotionMode == "ให้กำลังใจ":
            print("emotionMode", emotionMode)
            prompt_template_file = PROMPT_TEMPLATE_DIR / (
                f"blue_whale_{emotionMode}.txt"
                if llm_name == "สีน้ำเงิน"
                else f"pink_dolphin_{emotionMode}.txt"
            )

        elif emotionMode == "ให้คำแนะนำ":
            print("emotionMode", emotionMode)
            prompt_template_file = PROMPT_TEMPLATE_DIR / (
                f"blue_whale_{emotionMode}.txt"
                if llm_name == "สีน้ำเงิน"
                else f"pink_dolphin_{emotionMode}.txt"
            )

        else:
            prompt_template_file = PROMPT_TEMPLATE_DIR / (
                "blue_whale.txt" if llm_name == "สีน้ำเงิน" else "pink_dolphin.txt"
            )

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
        i = 0
        for i in range(1, len(message_list) + 1):
            if message_list[-i]["role"] != "user":
                break
        if i > 1:
            return message_list[: -i + 1], message_list[-i + 1 :]
        return message_list, []

    def detect_end_of_stream(
        self, cur_str: str, cur_token: Optional[str]
    ) -> Tuple[str, Optional[str]]:
        sentence = None
        if cur_token is None:
            sentence = cur_str
            cur_str = ""
        # elif len(in_bucket) > 0:
        #     if in_bucket in cur_token:
        #         if len(cur_token) == 1:
        #             sentence = cur_str + cur_token[0]
        #             cur_str = ""
        #         else:
        #             temp = cur_token.split(in_bucket)
        #             sentence = cur_str + temp[0] + in_bucket
        #             cur_str = in_bucket.join(temp[1:])
        #     else:
        #         cur_str += cur_token
        #         continue_loop = True
        elif " " in cur_token:
            if len(cur_token) == 1:
                if cur_str[-1] in ["ๆ", ",", '"', "'"]:
                    cur_str += cur_token[0]
                else:
                    sentence = cur_str
                    cur_str = ""
            else:
                splitted = cur_token.split(" ")
                if len(splitted[0]) == 0 and cur_str[-1] in ["ๆ", ",", '"', "'"]:
                    cur_str += " ".join(splitted[1:])
                elif len(splitted[0]) > 0 and splitted[0][-1] in ["ๆ", ",", '"', "'"]:
                    cur_str += " ".join(splitted)
                else:
                    sentence = cur_str + splitted[0]
                    cur_str = " ".join(splitted[1:])
        else:
            cur_str += cur_token

        if sentence is not None:
            sentence = sentence.strip(".")
            sentence = sentence.replace("ครับ", "")
            if len(sentence) == 0:
                sentence = None

        return cur_str, sentence

    async def security_detection(
        self,
        message: Message,
    ) -> str:
        security_system_message = {
            "role": "system",
            "content": self._get_security_prompt(),
        }
        # print(message)
        target_message = {
            "role": "user",
            "content": message.text,
        }
        input_messages = [security_system_message] + [target_message]

        generated_texts = [
            s
            async for s in self.generate_text(
                input_messages, temperature=0, max_tokens=1000
            )
        ]
        if len(generated_texts) > 1:
            raise ValueError("Security detection must be used in non-stream mode")
        if len(generated_texts) == 0:
            return "normal"

        generated_text = generated_texts[0].lower()
        if "suicidal" in generated_text:
            return "self-harm"
        # if "harm others" in generated_text:
        #     return "harm others"
        return "normal"

    async def generate_reply(
        self,
        llm_name: str,
        user: User,
        user_chat: UserChat,
        messages: List[Message],
        emotionMode: str = "",
        stream: bool = False,
    ) -> AsyncGenerator[str, None]:
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

        generator = self.generate_text(
            input_messages, stream=stream, temperature=1, max_tokens=1000
        )

        if stream:
            # Manually split sentences
            cur_str = ""
            async for generated_text in self.generate_text(
                input_messages, stream=stream, temperature=1, max_tokens=1000
            ):
                cur_str, sentence = self.detect_end_of_stream(cur_str, generated_text)
                if sentence is not None:
                    yield sentence
            if len(cur_str) > 0:
                # Flush the remaining text
                yield cur_str
        else:
            generated_texts = [s async for s in generator]
            assert len(generated_texts) == 1
            generated_text = generated_texts[0]
            for sentence in self._post_process(generated_text):
                yield sentence

    async def predict_topics(
        self,
        user: User,
        messages: List[Message],
        topic_list: List[str],
        n_messages: int,
    ) -> List[str]:
        generator = self.generate_text(
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

        generated_texts = [s async for s in generator]
        if len(generated_texts) > 1:
            raise ValueError("Security detection must be used in non-stream mode")
        if len(generated_texts) == 0:
            return []

        topics = [topic for topic in topic_list if topic in generated_texts[0]]
        return topics

    async def predict_pss(self, pss_question: PSSQuestionModel) -> float:
        generated_text = self.generate_text(
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
        assert isinstance(generated_text, str), "PSS must be used in non-stream mode"
        print(generated_text)

        try:
            score = float(generated_text)
        except ValueError:
            score = 2

        return score


class OpenAILLMClient(LLMClient):
    DEFAULT_GENERATION_KWARGS = LLMClient.DEFAULT_GENERATION_KWARGS | {
        "model": "gpt-3.5-turbo",
    }

    def __init__(self):
        self.client = AsyncOpenAI(api_key="EMPTY", base_url="https://api.openai.com/v1")
        self.key_manager = APIKeyManager.from_str(ENV.get("OPENAI_API_KEYS"))

    @backoff.on_exception(backoff.expo, exception=OpenAIRateLimitError)
    async def generate_text(
        self, messages: Any, stream: bool = False, **kwargs
    ) -> AsyncGenerator[str, None]:
        with self.key_manager.context() as api_key:
            self.client.api_key = api_key
            stream_or_resp = await self.client.chat.completions.create(
                messages=messages,
                stream=stream,
                **(self.DEFAULT_GENERATION_KWARGS | kwargs),
            )
            if isinstance(stream_or_resp, ChatCompletion):
                generated_text = stream_or_resp.choices[0].message.content
                if generated_text is None:
                    raise ValueError("Invalid response from LLM")
                yield generated_text
            else:
                async for chunk in stream_or_resp:
                    content = chunk.choices[0].delta.content
                    if content is None:
                        return
                    yield content


class TyphoonLLMClient(OpenAILLMClient):
    DEFAULT_GENERATION_KWARGS = OpenAILLMClient.DEFAULT_GENERATION_KWARGS | {
        "model": "typhoon-v1.5x-70b-instruct",
        # "model": "typhoon-v2-70b-instruct",   # Found some bugs, the model may not be robust.
    }

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key="EMPTY", base_url="https://api.opentyphoon.ai/v1"
        )
        self.key_manager = APIKeyManager.from_str(ENV.get("TYPHOON_API_KEY"))


class SambaLLMClient(LLMClient):
    ENDPOINT = "https://kjddazcq2e2wzvzv.snova.ai/api/v1/chat/completion"
    DEFAULT_GENERATION_KWARGS = {
        "model": "llama3-70b-typhoon",
        "max_tokens": 1000,
        "temperature": 0.6,
        "stop": ["<|eot_id|>", "<|end_of_text|>"],
    }

    def __init__(self):
        self.key_manager = APIKeyManager.from_str(ENV.get("SAMBA_API_KEY"))

    def _get_payload(
        self, message_list: List[Dict[str, Any]], kwargs: Dict[str, Any]
    ) -> Dict[str, Any]:
        return self.DEFAULT_GENERATION_KWARGS | kwargs | {"inputs": message_list}

    async def _request(
        self, api_key: str, messages: List[Dict[str, Any]], kwargs: Dict[str, Any]
    ) -> str:
        headers = {
            "Authorization": f"Basic {api_key}",
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

    async def generate_text(
        self, messages: Any, stream: bool = False, **kwargs
    ) -> AsyncGenerator[str, None]:
        with self.key_manager.context() as api_key:
            yield await self._request(api_key, messages, kwargs)


class GeminiLLMClient(LLMClient):
    DEFAULT_GENERATION_KWARGS = {
        "max_output_tokens": 1000,
        "temperature": 0.6,
        "top_p": 1,
    }

    def __init__(self):
        self.model = "gemini-1.5-flash-002"
        self.key_manager = APIKeyManager.from_str(ENV.get("GEMINI_API_KEY"))
        self.client = genai.GenerativeModel(self.model)

    def _to_google_messsages(
        self, messages: List[Dict[str, str]]
    ) -> Tuple[str, List[Dict[str, str]]]:
        i = 0
        system_instructions = []
        while i < len(messages):
            if messages[i]["role"] != "system":
                break
            system_instructions.append(messages[i]["content"])
            i += 1

        ret: List[Dict[str, str]] = []
        for message in messages[i:]:
            role = message["role"]
            if role == "system":
                system_instructions.append(message["content"])
            else:
                ret.append({"role": role, "parts": message["content"]})

        return "\n".join(system_instructions), ret

    @backoff.on_exception(backoff.expo, exception=GoogleRateLimitError)
    async def generate_text(
        self, messages: Any, stream: bool = False, **kwargs
    ) -> AsyncGenerator[str, None]:
        with self.key_manager.context() as api_key:
            genai.configure(api_key=api_key)

            system_instruction, messages = self._to_google_messsages(messages)
            max_output_tokens = kwargs.pop(
                "max_tokens", self.DEFAULT_GENERATION_KWARGS["max_output_tokens"]
            )
            kwargs["max_output_tokens"] = max_output_tokens

            self.client._system_instruction = content_types.to_content(
                system_instruction
            )

            chat = self.client.start_chat(history=messages[:-1])
            config = genai.GenerationConfig(**(self.DEFAULT_GENERATION_KWARGS | kwargs))
            response = await chat.send_message_async(
                messages[-1]["parts"], generation_config=config, stream=stream
            )

            async for message in response:
                yield message.candidates[0].content.parts[0].text
