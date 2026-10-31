
from typing import Literal

from strands import tool


# Curated Bangladesh support directory.
# Contact details are based on the organizations' published information.
# Review these entries periodically because phone numbers and hours can change.

_SUPPORT_RESOURCES = [
    {
        "name": "Bangladesh National Emergency Service",
        "category": "emergency",
        "phone": "999",
        "availability": "24 hours a day, every day",
        "purpose": "Police, fire service, and ambulance in an emergency.",
        "website": "https://www.police.gov.bd/en/hot_line_number",
        "source": "Bangladesh Police",
    },
    {
        "name": "Kaan Pete Roi",
        "category": "emotional_support",
        "phone": "+880 9612-119911",
        "availability": "Every day, 3:00 PM to 3:00 AM",
        "purpose": (
            "Confidential emotional support and suicide-prevention "
            "listening from trained volunteers."
        ),
        "website": "https://kaanpeteroi.org/helpline-service/",
        "source": "Kaan Pete Roi official website",
    },
    {
        "name": "SHOJON - SAJIDA Foundation",
        "category": "professional_counselling",
        "phone": "09606-119900",
        "availability": (
            "SHOJON's contact page lists Saturday to Thursday, "
            "10:00 AM to 10:00 PM, and Friday as closed. "
            "However, its Urgent Help page states that trained "
            "counsellor support is available every day, "
            "10:00 AM to 10:00 PM. Friday availability should "
            "be confirmed by calling before relying on it."
        ),
        "purpose": (
            "Telephone-based mental-health support and access to "
            "professional counselling, with guidance toward "
            "psychologists or psychiatrists when appropriate."
        ),
        "website": "https://shojon.sajida.org/contact",
        "source": (
            "SHOJON official contact and Urgent Help pages; "
            "SAJIDA Foundation"
        ),
    },
    {
        "name": "Moner Bondhu",
        "category": "professional_counselling",
        "phone": "+880 1776-632344",
        "availability": "24 hours a day, according to its support page",
        "purpose": (
            "Crisis and emergency response support. WhatsApp is also "
            "listed at the same number."
        ),
        "website": "https://monerbondhu.com/check-in/support",
        "source": "Moner Bondhu official support page",
    },
]


@tool
def find_support_resources(
    support_need: Literal[
        "urgent",
        "emotional_support",
        "professional_counselling",
        "general",
    ] = "general",
) -> str:
    """
    Retrieve curated support contacts in Bangladesh.

    Use this tool when someone asks for human support, counselling,
    a helpline, or emergency assistance.

    Select:
    - urgent: immediate danger or urgent safety concerns.
    - emotional_support: someone who wants to talk to a trained listener.
    - professional_counselling: someone seeking mental-health care.
    - general: a broad list of available support options.

    Never invent contact details or availability.
    Explain that published hours and contact details can change.
    For immediate danger, prioritize National Emergency Service 999.
    """

    if support_need == "urgent":
        selected = [
            resource
            for resource in _SUPPORT_RESOURCES
            if resource["category"] == "emergency"
            or resource["name"] == "Kaan Pete Roi"
            or resource["name"] == "Moner Bondhu"
        ]
    elif support_need == "emotional_support":
        selected = [
            resource
            for resource in _SUPPORT_RESOURCES
            if resource["category"] == "emotional_support"
        ]
    elif support_need == "professional_counselling":
        selected = [
            resource
            for resource in _SUPPORT_RESOURCES
            if resource["category"] == "professional_counselling"
        ]
    else:
        selected = _SUPPORT_RESOURCES

    results = [
        {
            "name": resource["name"],
            "phone": resource["phone"],
            "availability": resource["availability"],
            "purpose": resource["purpose"],
            "website": resource["website"],
            "source": resource["source"],
        }
        for resource in selected
    ]

    return (
        "Bangladesh support directory. "
        "Contact details are based on the listed official sources. "
        "Availability can change; users should check the official "
        "website or call before relying on published hours. "
        f"Requested category: {support_need}. "
        f"Resources: {results}"
    )
