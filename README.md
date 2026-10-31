# MonBondhu (মনবন্ধু)
### A Bengali-first AI Emotional Support Navigator for University Students in Bangladesh

MonBondhu is an AI-powered emotional support companion designed to help university students in Bangladesh reflect on their emotions, explore manageable coping strategies, and find appropriate human support when needed.

It combines a Bengali-first conversational experience with mood check-ins, guided reflection, emotional pattern exploration, and a directory of support resources in Bangladesh.

**MonBondhu is not an AI therapist.** It does not diagnose mental-health conditions, prescribe treatment, or replace professional care. Its purpose is to make emotional reflection and access to human support more approachable.

---

## The problem

University students can experience academic pressure, loneliness, uncertainty, relationship difficulties, and emotional overwhelm. However, finding a comfortable first step toward support is not always easy.

Language barriers, limited awareness of available services, and uncertainty about where to seek help can make that first step harder.

MonBondhu aims to bridge this gap through a familiar Bengali-first interface and practical pathways to human support.

## Key features

### 1. Daily emotional check-ins
- Record how you're feeling and the intensity of that feeling.
- Add an optional personal note.
- Keep check-in history in the browser.

### 2. Emotional Compass
- Explore recent emotional patterns.
- View a seven-day overview of check-ins.
- See mood-category counts and average intensity.
- Calculate patterns locally in the browser.

### 3. AI Companion
- Have supportive conversations in Bengali, Banglish, or English.
- Receive empathetic, non-judgmental responses.
- Explore practical, low-risk coping suggestions.
- Use recent conversation history for conversational continuity.

### 4. Guided Reflection
- Explore structured reflection exercises.
- Work through academic stress, relationships, loneliness, uncertainty, and general emotional difficulties.

### 5. Find Support
- Discover relevant support services in Bangladesh.
- Explore professional counselling and other human-support options.
- Access contact details and available service information.

### 6. Privacy-conscious mood sharing
- Check-ins and personal notes remain in browser storage.
- Chat conversations use session storage and are cleared when the browser tab session ends.
- Mood summaries are not sent automatically.
- Users can explicitly opt in to sharing an aggregate seven-day mood summary with the AI Companion.
- The optional summary contains aggregate counts and average intensity, not personal notes or individual check-in records.

---

## How it works

MonBondhu combines a React frontend with a FastAPI backend and a Strands-powered AI agent.

```text
                    MonBondhu
                        |
              React + Vite Frontend
                        |
                 FastAPI Backend
                        |
              Deterministic Safety
                    Screening
                        |
                 Strands Agent
                        |
              Amazon Bedrock
                        |
             Claude Sonnet 4.6
                        |
             Available Agent Tools
              /        |        \
       Guided       Mood       Support
      Reflection   Patterns    Resources
```

The mood-pattern tool is available only when the user explicitly opts in to sharing their aggregate mood summary.

Safety screening runs before the AI agent is invoked. Messages that match the configured urgent-risk patterns receive a deterministic human-support response instead of being sent to the language model.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build tool | Vite |
| Backend | Python, FastAPI |
| AI agent framework | Strands Agents SDK |
| AI model | Claude Sonnet 4.6 |
| Model platform | Amazon Bedrock |
| Cloud region | AWS `ap-south-1` |
| Browser storage | localStorage and sessionStorage |

## Project structure

```text
monbondhu/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── agent.py
│   │   ├── safety.py
│   │   └── support_resources.py
│   ├── tests/
│   │   ├── test_safety.py
│   │   └── test_safety_evaluation.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

The exact frontend source structure may evolve as development continues.

---

## Run locally

### Prerequisites

- Python 3.11 or newer
- Node.js and npm
- Git
- An AWS account with access to Amazon Bedrock
- AWS credentials configured through an appropriate local AWS profile or environment

### 1. Clone the repository

```bash
git clone https://github.com/tanvirh47/monbondhu.git
cd monbondhu
```

### 2. Configure the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows Git Bash:**

```bash
source .venv/Scripts/activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your local environment file:

```bash
cp .env.example .env
```

Configure the values in `backend/.env`:

```env
AWS_REGION=ap-south-1
BEDROCK_MODEL_ID=global.anthropic.claude-sonnet-4-6
FRONTEND_ORIGIN=http://localhost:5173
```

Configure AWS authentication separately using your AWS profile or another supported credential provider. Do not put AWS access keys in the `.env.example` file or commit credentials to GitHub.

Make sure the selected Bedrock model is enabled and accessible to your AWS identity.

Start the backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

`http://localhost:8000`

Health check:

`http://localhost:8000/health`

### 3. Configure the frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

Its default configuration is:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the local Vite URL shown in your terminal.

---

## API

### `GET /health`

Checks whether the backend service is responding.

### `POST /api/chat`

Accepts a user message and returns an AI-generated response or a deterministic safety response.

Example request:

```json
{
  "message": "আজকে আমার মনটা খারাপ।",
  "language": "auto",
  "history": [],
  "mood_context": null
}
```

The optional `history` field provides recent conversational context.

The optional `mood_context` field carries an aggregate mood summary when the user has explicitly opted in.

Example response:

```json
{
  "reply": "তোমার মন খারাপ লাগছে শুনে খারাপ লাগল...",
  "safety_level": "standard",
  "next_step": "reflection"
}
```

Urgent-risk responses use the deterministic safety pathway and can return a different `safety_level` and `next_step`.

---

## Safety and responsible AI

Emotional support applications require careful boundaries.

MonBondhu includes:

- Deterministic first-pass screening for configured urgent-risk phrases.
- Bengali, Banglish, and English phrase coverage.
- A human-support response pathway for messages that trigger urgent screening.
- Support-resource navigation for relevant situations.
- No diagnosis or medication recommendations.
- Explicit opt-in before sharing aggregate mood information with the AI agent.

### Important limitations

The safety phrase screen is a prototype safeguard, not a clinically validated suicide or self-harm risk assessment.

It can miss risk, misunderstand context, and flag benign language. Passing automated tests does not establish clinical accuracy or guarantee that every crisis will be detected.

The support directory should be checked periodically because contact details and service availability can change.

MonBondhu should not be relied upon as an emergency service or as the sole safety mechanism. Real-world deployment requires qualified mental-health and safeguarding review, appropriate privacy protections, and reliable escalation procedures.

If someone is in immediate danger, they should contact local emergency services or seek emergency medical care.

---

## Evaluation

The project includes automated safety evaluation tests covering configured urgent-risk and ordinary-language scenarios.

Current development evaluation:

- **45 safety evaluation cases passed.**
- Bengali emotional-support conversation tested.
- Banglish understanding tested.
- Guided reflection tested.
- Practical coping suggestions tested.
- Human-support resource lookup tested.
- Browser chat-session storage and clearing tested.

These results describe prototype testing, not clinical validation or a guarantee of safety.

Run the safety evaluation suite from the backend directory:

```bash
python -m pytest tests/test_safety_evaluation.py -v
```

---

## Project goals

MonBondhu is being developed as a social-good project for the AWS Strands SDK: Workshop to Ship challenge.

The project explores how an AI agent can support emotional reflection and help students navigate toward human support while keeping privacy, language accessibility, and responsible AI boundaries in mind.

## Future improvements

- Further evaluation with native Bengali and Banglish speakers.
- Qualified mental-health and safeguarding review.
- Continued verification of Bangladesh support resources.
- Improved accessibility and usability.
- Secure, production-ready deployment and operational monitoring.

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

---

**Built with care for students in Bangladesh.**

MonBondhu (মনবন্ধু) means a friend of the mind.