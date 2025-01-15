import asyncio
import datetime
import uuid
from typing import List, Optional, Union
from uuid import uuid4
from zoneinfo import ZoneInfo

import tzlocal
from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore
from apscheduler.triggers.date import DateTrigger  # type: ignore
from fastapi_users_db_sqlalchemy import UUID_ID
from pythainlp import util  # type: ignore
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .connections import ChatEvent, ConnectionManager
from .db import (
    Chat,
    Message,
    MessageDatabase,
    NotificationTask,
    NotificationTaskDatabase,
    OAuthAccount,
    User,
    UserChat,
    UserDatabase,
    async_session_maker,
    get_chat_info,
)
from .llm import LLMClient


class NotificationScheduler:
    def __init__(self, llm_client: LLMClient, connection_manager: ConnectionManager):
        self.llm_client = llm_client
        self.connection_manager = connection_manager
        self.scheduler = AsyncIOScheduler()
        self._is_started = False

    @property
    def is_started(self):
        return self._is_started

    async def start(self):
        if self._is_started:
            return
        self._is_started = True
        self.scheduler.start()
        async with async_session_maker() as db:
            statement = select(NotificationTask)
            result = await db.execute(statement)
            tasks = result.scalars().all()
            for task in tasks:
                tz = _get_timezone(task.timezone, task.timedelta)
                if not self._validate_scheduled_time(
                    _astimezone(datetime.datetime.now(), tz),
                    _astimezone(task.scheduled_at, tz),
                ):
                    await db.delete(task)
                    continue
                trigger = DateTrigger(run_date=task.scheduled_at)
                user = await UserDatabase(db, User, OAuthAccount).get(task.user_id)
                chat_info = await get_chat_info(task.user_id, task.chat_id, db)
                if chat_info is None:
                    continue
                user_chat, chat, llm_user = chat_info
                self.scheduler.add_job(
                    notification_task,
                    trigger,
                    args=[
                        task.id,
                        self.llm_client,
                        self.connection_manager,
                        user,
                        llm_user,
                        user_chat,
                        chat,
                        db,
                    ],
                    id=str(task.id),
                )
            await db.commit()

    def remove_task(self, task_id: UUID_ID):
        self.scheduler.remove_job(str(task_id))

    async def should_schedule(self, user: User, context: List[Message]) -> bool:
        message_list = (
            [
                {
                    "role": "system",
                    # "content": (
                    #     "คุณเป็นเพื่อนของผู้ใช้งานที่คอยรับฟังผู้ใช้งานมาระบายความเครียดให้ฟัง "
                    #     "คุณตอบรับด้วยความเห็นใจอย่างอ่อนโยนและไม่ตัดสิน คุณตอบรับสั้น ๆ ด้วยความเป็นกันเอง ไม่ลงท้ายด้วยครับหรือค่ะ"
                    # ),
                    "content": (
                        "คุณเป็นระบบที่คอยตัดสินว่าควรจะส่งข้อความให้กำลังใจหรือไม่ โดยใช้ข้อความที่ผ่านมาเป็นข้อมูลเพื่อตัดสินใจ"
                    ),
                }
            ]
            + self.llm_client._prepare_messages(user, context)
            + [
                {
                    "role": "user",
                    "content": (
                        "จากข้อความข้างต้น คุณคิดว่าผู้ใช้งานควรจะได้รับข้อความให้กำลังใจหรือไม่ ตอบแค่ใช่หรือไม่"
                    ),
                }
            ]
        )
        generated_text = await self.llm_client.generate_text(
            message_list, temperature=0
        )
        result = True if generated_text.strip() == "ใช่" else False
        return result

    def _get_context(self, user: User, messages: List[Message]) -> List[Message]:
        i = None
        for i in range(1, len(messages) + 1):
            i = -i
            if messages[i].sender_id != user.id:
                break
        if i is None or i == -1:
            return []
        return messages[i + 1 :]

    def _validate_scheduled_time(
        self,
        current_time: datetime.datetime,
        scheduled_time: datetime.datetime,
        min_time_delay: datetime.timedelta = datetime.timedelta(minutes=30),
        max_time_delay: datetime.timedelta = datetime.timedelta(days=30),
    ) -> bool:
        if scheduled_time < current_time + min_time_delay:
            return False
        if scheduled_time - current_time > max_time_delay:
            return False
        return True

    async def schedule(
        self,
        user: User,
        llm_user: User,
        user_chat: UserChat,
        chat: Chat,
        context: List[Message],
        timezone: Union[str, int],
        db: AsyncSession,
    ):
        now = _astimezone(datetime.datetime.now(), timezone)
        date_now = now.date().strftime("%d/%m/%Y")
        time_now = now.time().strftime("%H:%M")

        message_list = (
            [
                {
                    "role": "system",
                    "content": "คุณเป็นระบบที่คอยตัดสินว่าควรจะส่งข้อความให้กำลังใจเมื่อไร โดยใช้ข้อความที่ผ่านมาเป็นข้อมูลเพื่อตัดสินใจ",
                }
            ]
            + self.llm_client._prepare_messages(user, context)
            + [
                {
                    "role": "user",
                    "content": (
                        f"วันนี้เป็นวันที่ {date_now} (DD/MM/YYYY) เวลา {time_now}\n"
                        "จากข้อความข้างต้น คุณคิดว่าผู้ใช้งานควรจะได้รับข้อความให้กำลังใจเมื่อไร\n"
                        'จงลงท้ายข้อความของคุณด้วยคำตอบในรูปของ "คำตอบ: DD/MM/YYYY, HH:MM"'
                    ),
                }
            ]
        )
        generated_text = await self.llm_client.generate_text(
            message_list, temperature=0
        )
        answer_text = generated_text.rsplit("คำตอบ: ", 1)[1]
        schedule_time = _replace_timezone(
            datetime.datetime.strptime(answer_text.strip(), "%d/%m/%Y, %H:%M"), timezone
        )

        if not self._validate_scheduled_time(now, schedule_time):
            return

        task = NotificationTask(
            id=uuid.uuid4(),
            user_id=user.id,
            chat_id=user_chat.chat_id,
            context=[message.id for message in context],
            scheduled_at=schedule_time.astimezone(tzlocal.get_localzone()),
            timezone=timezone if isinstance(timezone, str) else None,
            timedelta=timezone if isinstance(timezone, int) else None,
        )
        trigger = DateTrigger(run_date=schedule_time)
        self.scheduler.add_job(
            notification_task,
            trigger,
            args=[
                task.id,
                self.llm_client,
                self.connection_manager,
                user,
                llm_user,
                user_chat,
                chat,
                db,
            ],
            id=str(task.id),
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

    async def analyze_and_schedule(
        self,
        messages: List[Message],
        timezone: Union[str, int],
        user: User,
        llm_user: User,
        user_chat: UserChat,
        chat: Chat,
        db: AsyncSession,
    ):
        context = self._get_context(user, messages)
        if await self.should_schedule(user, context):
            await self.schedule(user, llm_user, user_chat, chat, context, timezone, db)


def _get_timezone(timezone: Optional[str], timedelta: Optional[int]) -> Union[str, int]:
    if timezone is not None:
        return timezone
    if timedelta is not None:
        return timedelta
    raise ValueError("Either timezone or timedelta must be provided")


def _astimezone(dt: datetime.datetime, timezone: Union[str, int]) -> datetime.datetime:
    if isinstance(timezone, int):
        tz = datetime.timezone(datetime.timedelta(minutes=timezone))
    else:
        tz = ZoneInfo(timezone)
    return dt.astimezone(tz)


def _replace_timezone(
    dt: datetime.datetime, timezone: Union[str, int]
) -> datetime.datetime:
    if isinstance(timezone, int):
        tz = datetime.timezone(datetime.timedelta(minutes=timezone))
    else:
        tz = ZoneInfo(timezone)
    return dt.replace(tzinfo=tz)


async def notification_task(
    task_id: UUID_ID,
    llm_client: LLMClient,
    connection_manager: ConnectionManager,
    user: User,
    llm_user: User,
    user_chat: UserChat,
    chat: Chat,
    db: AsyncSession,
):
    task = await NotificationTaskDatabase(db).delete_and_return(task_id)
    if task is None:
        return

    context = await MessageDatabase(db).get_by_id_list(task.context)

    assert llm_user.username is not None

    tz = _get_timezone(task.timezone, task.timedelta)
    context_time = _astimezone(context[-1].created_at, tz) if context else None
    scheduled_time = _astimezone(task.scheduled_at, tz)
    scheduled_time_date_str = util.thai_strftime(scheduled_time, "%-d %B %Y")
    scheduled_time_time_str = scheduled_time.strftime("%H:%M:%S")
    query_message = Message(
        id=uuid4(),
        sender_id=user.id,
        chat_id=chat.id,
        created_at=datetime.datetime.now(),
        text=(
            (
                f"คุณได้รับข้อความข้างต้นเมื่อวันที่ {util.thai_strftime(context_time, '%-d %B %Y')} เวลา {context_time.strftime('%H:%M:%S')} "
                if context_time
                else ""
            )
            + f"คุณตัดสินใจ ณ ตอนได้รับข้อความข้างต้นว่าจะส่งข้อความให้กำลังใจในวันที่ {scheduled_time_date_str} เวลา {scheduled_time_time_str} "
            + f"ขณะนี้วันที่ {scheduled_time_date_str} เวลา {scheduled_time_time_str}\n"
            "คุณต้องพิจารณาเวลาที่ได้รับข้อความ และเวลา ณ ขณะนี้อย่างรอบคอบก่อน แล้วตอบว่า"
            "ฉันควรจะได้รับข้อความให้กำลังใจว่าอย่างไรดี"
        ),
    )
    sentences = await llm_client.generate_reply(
        llm_user.username,
        user,
        user_chat,
        list(context) + [query_message],
    )

    await send_messages(
        connection_manager, sentences, user, llm_user, user_chat, chat, db
    )


async def send_messages(
    connection_manager: ConnectionManager,
    messages: List[str],
    user: User,
    llm_user: User,
    user_chat: UserChat,
    chat: Chat,
    db: AsyncSession,
):
    for i, message in enumerate(messages):
        await asyncio.sleep(2)

        new_message = Message(
            id=uuid.uuid4(),
            chat_id=chat.id,
            sender_id=llm_user.id,
            created_at=datetime.datetime.now(),
            text=message,
        )

        user_chat.last_message = message
        user_chat.is_seen = False
        user_chat.unread_messages += 1
        chat.updated_at = new_message.created_at

        db.add(new_message)
        db.add(user_chat)
        db.add(chat)

        if connection_manager.is_online(user.id):
            await connection_manager.send(
                user.id,
                ChatEvent.MESSAGE,
                {
                    "messageId": str(new_message.id),
                    "chatId": str(new_message.chat_id),
                    "senderId": str(new_message.sender_id),
                    "createdAt": int(new_message.created_at.timestamp() * 1000),
                    "text": message,
                    "last_one": (i + 1) == len(messages),
                },
            )
        await db.commit()
