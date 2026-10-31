
import logging
import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agent import build_agent
from .safety import screen_message


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MonBondhu API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: Literal["auto", "bangla", "banglish", "english"] = "auto"
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    mood_context: str | None = Field(default=None, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    safety_level: str
    next_step: str


def build_conversation_prompt(payload: ChatRequest, message: str) -> str:
    history_lines = []

    for item in payload.history:
        speaker = "User" if item.role == "user" else "MonBondhu"
        history_lines.append(f"{speaker}: {item.text}")

    history_text = "\n".join(history_lines)

    return (
        f"Recent conversation:\n{history_text}\n\n"
        f"Latest user message:\n{message}"
    )


def build_urgent_response() -> str:
    return (
        "তুমি এখন খুব কঠিন সময়ের মধ্য দিয়ে যাচ্ছ। "
        "তোমার নিরাপত্তা সবচেয়ে গুরুত্বপূর্ণ। দয়া করে একা থেকো না। "
        "বিশ্বাসযোগ্য কাউকে এখনই জানাও এবং সম্ভব হলে তার সঙ্গে থাকো।\n\n"
        "যদি তুমি এখনই বিপদে থাকো বা নিজের নিরাপত্তা নিশ্চিত করতে "
        "না পারো, তাহলে বাংলাদেশ জাতীয় জরুরি সেবা ৯৯৯-এ কল করো "
        "অথবা কাছের হাসপাতালের জরুরি বিভাগে যাও।\n\n"
        "মানুষের সঙ্গে কথা বলার জন্য আরও কিছু সহায়তা:\n\n"
        "**Kaan Pete Roi**\n"
        "ফোন: +880 9612-119911\n"
        "সময়: প্রতিদিন বিকেল ৩টা থেকে রাত ৩টা। "
        "প্রশিক্ষিত স্বেচ্ছাসেবকদের কাছ থেকে গোপনীয়ভাবে "
        "মানসিক সহায়তা পাওয়া যায়।\n"
        "ওয়েবসাইট: https://kaanpeteroi.org/helpline-service/\n\n"
        "**Moner Bondhu**\n"
        "ফোন: +880 1776-632344\n"
        "ওয়েবসাইট: https://monerbondhu.com/check-in/support\n\n"
        "ফোন নম্বর ও সেবার সময় পরিবর্তিত হতে পারে। "
        "সম্ভব হলে অফিসিয়াল ওয়েবসাইটে সর্বশেষ তথ্য যাচাই করো। "
        "এই মুহূর্তে একা সবকিছু সামলানোর প্রয়োজন নেই।"
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty",
        )

    safety_level = screen_message(message)

    if safety_level == "urgent_review":
        return ChatResponse(
            reply=build_urgent_response(),
            safety_level="urgent_review",
            next_step="human_support",
        )

    prompt = build_conversation_prompt(payload, message)

    try:
        agent = build_agent(
            mood_context=payload.mood_context
        )

        result = agent(prompt)

        reply = str(result).strip()

        if not reply:
            raise RuntimeError("Agent returned an empty response")

        return ChatResponse(
            reply=reply,
            safety_level="standard",
            next_step="reflection",
        )

    except Exception:
        logger.exception("Chat agent request failed")

        raise HTTPException(
            status_code=503,
            detail="MonBondhu is temporarily unavailable. Please try again.",
        )
