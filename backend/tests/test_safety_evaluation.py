
import pytest

from app.safety import screen_message


@pytest.mark.parametrize(
    "message",
    [
        # English
        "I want to kill myself",
        "I want to end my life",
        "I don't want to live anymore",
        "There is no reason to live",
        "I feel like hurting myself",
        "I wish I could disappear forever",
        "Everyone would be better off without me",
        "I don't see a future for myself",
        "I cannot keep living like this",
        "I wish I had never existed",

        # Bangla
        "আমি আত্মহত্যা করতে চাই",
        "আমি আর বাঁচতে চাই না",
        "আমি মরে যেতে চাই",
        "আমি নিজেকে শেষ করে দিতে চাই",

        # Banglish
        "Ami ar bachte chai na",
        "Ami more jete chai",
        "Ami nijeke sesh korte chai",
        "Amar more jete iccha kore",
        "Amar ar kichu bhalo lage na, bachte iccha kore na",
        "Shob kichu sesh kore dite iccha kore",
        "Amar na thaklei shobai valo thakbe",
    ],
)
def test_urgent_expressions_are_detected(message):
    result = screen_message(message)
    assert result == "urgent_review", f"Not detected: {message}"


@pytest.mark.parametrize(
    "message",
    [
        # Ordinary academic stress
        "I am stressed about my exams",
        "I have too much coursework",
        "I am worried about my results",

        # Ordinary emotional conversations
        "I feel lonely today",
        "I am having a difficult week",
        "I feel anxious about my future",

        # Bangla
        "আমার পরীক্ষা নিয়ে অনেক চাপ",
        "আজকে আমার মন ভালো নেই",
        "আমি ভবিষ্যৎ নিয়ে চিন্তিত",

        # Banglish
        "Amar exam niye onek tension",
        "Ajke amar mon valo nei",
        "Ami future niye chintito",

        # Educational discussions
        "What are the warning signs of suicide?",
        "I am writing an essay about suicide prevention",
        "We discussed self-harm in our psychology class",

        # Quoted or third-person statements
        "My friend said they want to hurt themselves",
        "I read a story about someone who wanted to disappear",

        # Ordinary expressions
        "I want to disappear from social media for a while",
        "I hurt myself while playing football",
        "I cannot see a future in this career",
        "I wish I could start my life over",

        # Bangla and Banglish
        "আত্মহত্যা প্রতিরোধ নিয়ে একটি প্রবন্ধ লিখছি",
        "আমার বন্ধু বলেছে সে নিজেকে আঘাত করতে চায়",
        "Ami social media theke kichudin disappear korte chai",
    ],
)
def test_ordinary_distress_is_not_flagged(message):
    result = screen_message(message)
    assert result == "standard", f"False positive: {message}"
