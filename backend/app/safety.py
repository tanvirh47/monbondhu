
"""
Prototype-only phrase screen.

This is NOT a validated suicide/self-harm risk assessment.

It uses phrase matching to identify messages that need a cautious,
human-support-oriented response. It may miss indirect expressions
or flag messages that discuss these topics without expressing
personal risk.

Expand and evaluate with qualified reviewers and native Bangla
and Banglish speakers before any real-world use.
"""

import re


_HIGH_RISK_PATTERNS = [
    # English: direct expressions
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bi want to commit suicide\b",
    r"\bi am thinking about suicide\b",
    r"\bi'm thinking about suicide\b",
    r"\bi am considering suicide\b",
    r"\bi'm considering suicide\b",
    r"\bwant to die\b",
    r"\bcan't go on\b",
    r"\bcannot go on\b",
    r"\bno reason to live\b",
    r"\bdon't want to live\b",
    r"\bdo not want to live\b",

    # English: self-harm intent
    r"\bi feel like hurting myself\b",
    r"\bi feel like harming myself\b",
    r"\bi want to hurt myself\b",
    r"\bi want to harm myself\b",
    r"\bi might hurt myself\b",
    r"\bi am going to hurt myself\b",
    r"\bi'm going to hurt myself\b",
    r"\bi am going to harm myself\b",
    r"\bi'm going to harm myself\b",

    # English: indirect distress
    r"\bi wish i could disappear forever\b",
    r"\beveryone would be better off without me\b",
    r"\bi don't see a future for myself\b",
    r"\bi cannot keep living like this\b",
    r"\bi can't keep living like this\b",
    r"\bi wish i had never existed\b",

    # Bangla: direct expressions
    r"আত্মহত্যা\s*করতে চাই",
    r"আত্মহত্যা\s*করব",
    r"আত্মহত্যা\s*করবো",
    r"নিজেকে\s*শেষ\s*করে দিতে চাই",
    r"নিজেকে\s*শেষ\s*করতে চাই",
    r"মরে যেতে চাই",
    r"বেঁচে থাকতে চাই না",
    r"বাঁচতে চাই না",
    r"নিজেকে\s*মেরে\s*ফেলতে চাই",
    r"মরে যাওয়া ভালো",

    # Banglish: direct expressions
    r"\bami ar bachte chai na\b",
    r"\bami bachte chai na\b",
    r"\bamar more jete iccha kore\b",
    r"\bamar more jete mon chai\b",
    r"\bami more jete chai\b",
    r"\bami nijeke sesh korte chai\b",
    r"\bnijeke sesh kore dite chai\b",
    r"\bami ar bachte parbo na\b",

    # Banglish: indirect distress
    r"\bamar ar kichu bhalo lage na\b.*\bbachte iccha kore na\b",
    r"\bbachte iccha kore na\b",
    r"\bshob kichu sesh kore dite iccha kore\b",
    r"\bamar na thaklei shobai valo thakbe\b",
]


_COMPILED_PATTERNS = [
    re.compile(pattern)
    for pattern in _HIGH_RISK_PATTERNS
]


def screen_message(message: str) -> str:
    """
    Check a message for configured high-risk phrases.

    Returns:
        "urgent_review" if a configured phrase is detected.
        "standard" otherwise.

    This function does not determine a person's actual risk level.
    """

    normalized = re.sub(
        r"\s+",
        " ",
        message.casefold()
    ).strip()

    if any(
        pattern.search(normalized)
        for pattern in _COMPILED_PATTERNS
    ):
        return "urgent_review"

    return "standard"
