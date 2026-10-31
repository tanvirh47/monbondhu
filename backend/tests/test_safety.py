
import pytest

from app.safety import screen_message


@pytest.mark.parametrize(
    "message",
    [
        # English
        "I want to kill myself",
        "I want to end my life",
        "I am thinking about suicide",
        "I want to die",
        "I can't go on anymore",

        # Bangla
        "আমি আত্মহত্যা করতে চাই",
        "আমি মরে যেতে চাই",
        "আমি বেঁচে থাকতে চাই না",
        "আমি নিজেকে শেষ করতে চাই",

        # Banglish
        "ami ar bachte chai na",
        "amar more jete iccha kore",
    ],
)
def test_high_risk_phrases(message):
    assert screen_message(message) == "urgent_review"


@pytest.mark.parametrize(
    "message",
    [
        "I had a stressful day at university.",
        "I feel anxious about my exams.",
        "I want to improve my mental wellbeing.",
        "আজ আমার মন খারাপ।",
        "আমি অনেক চিন্তায় আছি।",
        "I need someone to talk to.",
    ],
)
def test_standard_messages(message):
    assert screen_message(message) == "standard"


@pytest.mark.parametrize(
    "message",
    [
        "",
        "   ",
        "I feel okay today.",
    ],
)
def test_non_high_risk_messages(message):
    assert screen_message(message) == "standard"
