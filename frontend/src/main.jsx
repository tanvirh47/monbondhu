
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowUpRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Heart,
  Leaf,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Sun,
  Trash2
} from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CHECKIN_STORAGE_KEY = 'monbondhu_checkins_v1';
const DRAFT_STORAGE_KEY = 'monbondhu_draft_v1';
const CHAT_STORAGE_KEY = 'monbondhu_chat_v1';

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function loadStoredValue(key, fallback) {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) return fallback;

    return JSON.parse(stored);
  } catch (error) {
    console.error(`Could not load ${key}:`, error);
    return fallback;
  }
}

function loadCheckins() {
  const parsed = loadStoredValue(CHECKIN_STORAGE_KEY, []);

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    item =>
      item &&
      typeof item.id === 'string' &&
      typeof item.emotion === 'string' &&
      Number.isInteger(item.intensity) &&
      typeof item.timestamp === 'string' &&
      typeof item.date === 'string'
  );
}

function loadDraft() {
  const draft = loadStoredValue(DRAFT_STORAGE_KEY, {}) || {};

  return {
    mood: typeof draft.mood === 'string' ? draft.mood : '',
    intensity:
      Number.isInteger(draft.intensity) &&
      draft.intensity >= 1 &&
      draft.intensity <= 5
        ? draft.intensity
        : 3,
    note: typeof draft.note === 'string' ? draft.note : '',
    saved: draft.saved === true
  };
}

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: 'হ্যালো। আজ তোমার দিনটা কেমন যাচ্ছে? চাইলে ধীরে ধীরে বলতে পারো। আমি শুনছি।'
  }
];

function loadMessages() {
  // Remove the old persistent chat copy from localStorage.
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (error) {
    console.error('Could not remove old persistent chat:', error);
  }

  // Restore messages only from the current browser tab session.
  try {
    const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);

    if (!stored) return INITIAL_MESSAGES;

    const messages = JSON.parse(stored);

    if (!Array.isArray(messages)) {
      return INITIAL_MESSAGES;
    }

    const validMessages = messages.filter(
      item =>
        item &&
        ['user', 'assistant'].includes(item.role) &&
        typeof item.text === 'string'
    );

    return validMessages.length ? validMessages : INITIAL_MESSAGES;
  } catch (error) {
    console.error('Could not load session chat:', error);
    return INITIAL_MESSAGES;
  }
}

const MOOD_OPTIONS = [
  ['low', 'Low', 'A little heavy'],
  ['anxious', 'Anxious', 'Mind feels busy'],
  ['okay', 'Okay', 'Taking it as it comes'],
  ['good', 'Good', 'Some things feel lighter'],
  ['bright', 'Bright', 'Feeling more like me']
];

const MOOD_LABELS = {
  low: 'Low',
  anxious: 'Anxious',
  okay: 'Okay',
  good: 'Good',
  bright: 'Bright'
};

const INTENSITY_LABELS = {
  1: 'Very slight',
  2: 'Mild',
  3: 'Moderate',
  4: 'Strong',
  5: 'Very strong'
};

function getLastSevenDays() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    return {
      date: getLocalDateKey(date),
      label: date.toLocaleDateString('en-US', {
        weekday: 'short'
      })
    };
  });
}

function calculateCompass(checkins) {
  const days = getLastSevenDays();
  const dateKeys = new Set(days.map(day => day.date));

  const recentCheckins = checkins.filter(
    item => dateKeys.has(item.date)
  );

  const total = recentCheckins.length;

  const averageIntensity = total
    ? recentCheckins.reduce(
        (sum, item) => sum + item.intensity,
        0
      ) / total
    : null;

  const moodCounts = Object.fromEntries(
    Object.keys(MOOD_LABELS).map(mood => [mood, 0])
  );

  recentCheckins.forEach(item => {
    if (Object.hasOwn(moodCounts, item.emotion)) {
      moodCounts[item.emotion] += 1;
    }
  });

  const dominantMood = Object.entries(moodCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0] || null;

  const dailyIntensity = days.map(day => {
    const records = recentCheckins.filter(
      item => item.date === day.date
    );

    const average = records.length
      ? records.reduce(
          (sum, item) => sum + item.intensity,
          0
        ) / records.length
      : null;

    return {
      ...day,
      average,
      count: records.length
    };
  });

  return {
    total,
    averageIntensity,
    moodCounts,
    dominantMood,
    dailyIntensity
  };
}

// Creates a summary from aggregated check-in data only.
// Individual notes and personal records are never included.
function buildMoodContext(compass) {
  if (!compass || compass.total === 0) {
    return '';
  }

  const moodSummary = Object.entries(compass.moodCounts)
    .filter(([, count]) => count > 0)
    .map(([emotion, count]) => `${MOOD_LABELS[emotion]}: ${count}`)
    .join(', ');

  return [
    'The user explicitly chose to share their aggregated mood check-in summary.',
    'Period: Last 7 days.',
    `Total recorded check-ins: ${compass.total}.`,
    `Average self-reported intensity: ${compass.averageIntensity.toFixed(1)} out of 5.`,
    `Recorded mood counts: ${moodSummary}.`,
    'This summary contains no personal notes or individual check-in records.',
    'Use these numbers only as context. Do not diagnose or infer causes.'
  ].join('\n');
}

function App() {
  const [initialDraft] = useState(() => loadDraft());

  const [mood, setMood] = useState(initialDraft.mood);
  const [intensity, setIntensity] = useState(initialDraft.intensity);
  const [note, setNote] = useState(initialDraft.note);
  const [saved, setSaved] = useState(initialDraft.saved);

  const [checkins, setCheckins] = useState(() => loadCheckins());
  const [checkinError, setCheckinError] = useState('');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(() => loadMessages());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Mood sharing is optional and resets when the page is refreshed.
  const [shareMoodContext, setShareMoodContext] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHECKIN_STORAGE_KEY,
        JSON.stringify(checkins)
      );
    } catch (error) {
      console.error('Could not persist check-ins:', error);
    }
  }, [checkins]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          mood,
          intensity,
          note,
          saved
        })
      );
    } catch (error) {
      console.error('Could not persist check-in draft:', error);
    }
  }, [mood, intensity, note, saved]);

  // Chat is stored only for the current browser tab session.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error('Could not persist session chat:', error);
    }
  }, [messages]);

  const clearConversation = () => {
    if (sending) return;

    const confirmed = window.confirm(
      'Clear this conversation? Your messages will be removed from this browser tab.'
    );

    if (!confirmed) return;

    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (error) {
      console.error('Could not clear session chat:', error);
    }

    setMessages(INITIAL_MESSAGES);
    setMessage('');
    setError('');
  };

  const today = new Date();
  const todayKey = getLocalDateKey(today);

  const todayCheckins = checkins.filter(
    item => item.date === todayKey
  );

  const compass = calculateCompass(checkins);

  const dateDay = String(today.getDate()).padStart(2, '0');
  const dateMonth = String(today.getMonth() + 1).padStart(2, '0');

  const weekday = today.toLocaleDateString('en-US', {
    weekday: 'long'
  });

  const saveCheckin = () => {
    if (!mood) return;

    const record = {
      id: crypto.randomUUID(),
      emotion: mood,
      intensity,
      note: note.trim(),
      timestamp: new Date().toISOString(),
      date: getLocalDateKey()
    };

    const updatedCheckins = [...checkins, record].slice(-100);

    try {
      localStorage.setItem(
        CHECKIN_STORAGE_KEY,
        JSON.stringify(updatedCheckins)
      );

      setCheckins(updatedCheckins);
      setSaved(true);
      setCheckinError('');
      setNote('');
    } catch (error) {
      console.error('Could not save check-in:', error);

      setCheckinError(
        'Your check-in could not be saved. Check your browser storage settings and try again.'
      );

      setSaved(false);
    }
  };

  const sendMessage = async event => {
    event.preventDefault();

    const value = message.trim();

    if (!value || sending) return;

    const history = messages
      .slice(-12)
      .map(item => ({
        role: item.role,
        text: item.text
      }));

    const moodContext = shareMoodContext
      ? buildMoodContext(compass)
      : null;

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        text: value
      }
    ]);

    setMessage('');
    setSending(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: value,
          language: 'auto',
          history,
          mood_context: moodContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Assistant unavailable');
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          safety: data.safety_level
        }
      ]);

    } catch (error) {
      console.error('Chat request failed:', error);

      setError(
        'The companion is offline right now. Check that the API is running, then try again.'
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'আমি এখন সংযোগ করতে পারছি না। একটু পরে আবার চেষ্টা করো।'
        }
      ]);

    } finally {
      setSending(false);
    }
  };

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand-mark">
          <span className="brand-symbol">
            <Heart size={18} strokeWidth={2.2} />
          </span>
          <span>
            monbondhu<span className="brand-period">.</span>
          </span>
        </div>

        <div className="rail-rule" />

        <div className="rail-label">YOUR SPACE</div>

        <nav className="nav">
          <a className="nav-item active" href="#today">
            <Activity size={17} />
            <span>Today</span>
            <i />
          </a>

          <a className="nav-item" href="#compass">
            <Compass size={17} />
            <span>Emotional Compass</span>
          </a>

          <a className="nav-item" href="#companion">
            <MessageCircle size={17} />
            <span>Companion</span>
          </a>

          <a className="nav-item" href="#reflection">
            <Sun size={17} />
            <span>Reflection</span>
          </a>

          <a className="nav-item" href="#support">
            <ShieldCheck size={17} />
            <span>Find support</span>
          </a>
        </nav>

        <div className="rail-bottom">
          <div className="privacy-chip">
            <LockKeyhole size={14} />
            <span>No account required</span>
          </div>

          <div className="rail-foot">
            A SMALL STEP COUNTS
            <br />
            <b>VERSION 0.3 / PREVIEW</b>
          </div>
        </div>
      </aside>

      <main className="main" id="today">
        <header className="topbar">
          <div className="breadcrumb">
            YOUR SPACE <span>/</span> TODAY
          </div>

          <div className="top-right">
            <span className="status-dot" />
            <span>PERSONAL CHECK-IN</span>
            <button
              className="help-button"
              aria-label="About MonBondhu"
              type="button"
            >
              <CircleHelp size={17} />
            </button>
          </div>
        </header>

        <section className="intro">
          <div className="intro-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              A MOMENT FOR YOURSELF
            </div>

            <h1>
              You don't have
              <br />
              to figure it all out <em>today.</em>
            </h1>

            <p className="intro-text">
              Some days feel heavier than others. Start wherever you are.
              This space is here to help you pause, put feelings into words,
              and find a next step that feels manageable.
            </p>

            <a className="text-link" href="#companion">
              Talk it through <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="date-panel">
            <div className="date-top">
              <span>YOUR DAILY PAUSE</span>
              <Sun size={17} />
            </div>

            <div className="date-big">
              {dateDay}
              <span> / {dateMonth}</span>
            </div>

            <div className="date-caption">
              {weekday.toUpperCase()} · DAILY PAUSE
            </div>

            <div className="date-divider" />

            <div className="date-note">
              <span className="date-index">
                {String(todayCheckins.length).padStart(2, '0')}
              </span>
              <span>
                {todayCheckins.length === 1
                  ? 'Check-in recorded today.'
                  : todayCheckins.length > 1
                    ? 'Check-ins recorded today.'
                    : 'No check-in yet today.'}
                <br />
                You can start small.
              </span>
            </div>
          </div>
        </section>

        <section className="workspace">
          <div className="checkin panel" id="reflection">
            <div className="section-head">
              <div>
                <div className="eyebrow">01 / DAILY CHECK-IN</div>
                <h2>How are you feeling?</h2>
              </div>

              <span className="optional">TAKES ABOUT 1 MIN</span>
            </div>

            <p className="section-desc">
              There is no right answer. Choose what feels closest right now.
            </p>

            <div className="mood-list" role="group" aria-label="Choose your mood">
              {MOOD_OPTIONS.map(([id, label, desc], i) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mood === id}
                  onClick={() => {
                    setMood(id);
                    setSaved(false);
                    setCheckinError('');
                  }}
                  className={`mood-option ${mood === id ? 'selected' : ''}`}
                >
                  <span className="mood-number">0{i + 1}</span>

                  <span className="mood-copy">
                    <b>{label}</b>
                    <small>{desc}</small>
                  </span>

                  {mood === id
                    ? <Check size={16} />
                    : <span className="mood-arrow">↗</span>}
                </button>
              ))}
            </div>

            <div className="intensity-field">
              <label className="field-label" htmlFor="intensity">
                HOW STRONGLY ARE YOU FEELING THIS?
                <span>{intensity}/5</span>
              </label>

              <input
                id="intensity"
                type="range"
                min="1"
                max="5"
                step="1"
                value={intensity}
                onChange={event => {
                  setIntensity(Number(event.target.value));
                  setSaved(false);
                }}
                aria-valuetext={INTENSITY_LABELS[intensity]}
              />

              <div className="intensity-scale">
                <span>1 · Slight</span>
                <span>5 · Very strong</span>
              </div>

              <p className="intensity-description">
                {INTENSITY_LABELS[intensity]}
              </p>
            </div>

            <label className="field-label" htmlFor="note">
              A FEW WORDS ABOUT IT <span>OPTIONAL</span>
            </label>

            <textarea
              id="note"
              value={note}
              onChange={event => {
                setNote(event.target.value);
                setSaved(false);
              }}
              placeholder="What's been on your mind?"
              maxLength={1000}
            />

            <div className="checkin-bottom">
              <span className="privacy-note">
                <LockKeyhole size={13} />
                Saved only in this browser on this device.
              </span>

              <button
                className="button-primary"
                type="button"
                onClick={saveCheckin}
                disabled={!mood}
              >
                {saved
                  ? <><Check size={15} /> Check-in saved</>
                  : <>Save check-in <ChevronRight size={16} /></>}
              </button>
            </div>

            {checkinError && (
              <div className="error-line" role="alert">
                {checkinError}
              </div>
            )}

            {saved && (
              <p className="checkin-success" role="status">
                Your check-in has been saved on this device.
              </p>
            )}
          </div>

          <div className="checkin-history">
            <div className="history-heading">
              <div>
                <div className="eyebrow">YOUR RECORDS</div>
                <h3>Recent check-ins</h3>
              </div>
              <span>{checkins.length} TOTAL</span>
            </div>

            {checkins.length === 0 ? (
              <p className="history-empty">
                Your check-in history will appear here.
              </p>
            ) : (
              <div className="history-list">
                {[...checkins]
                  .sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                  )
                  .slice(0, 5)
                  .map(item => (
                    <div className="history-item" key={item.id}>
                      <div className="history-mood">
                        <b>{MOOD_LABELS[item.emotion] || item.emotion}</b>
                        <span>{item.date}</span>
                      </div>

                      <div className="history-intensity">
                        {item.intensity}/5
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <aside className="side-column">
            <div className="quote-panel">
              <div className="quote-mark">“</div>
              <p>
                You can be a work in progress and still deserve kindness.
              </p>
              <div className="quote-foot">
                <span className="tiny-rule" />
                A GENTLE REMINDER
              </div>
            </div>

            <div className="next-panel">
              <div className="eyebrow">A POSSIBLE NEXT STEP</div>
              <h3>
                Make room for
                <br />
                what you're feeling.
              </h3>
              <p>
                A short reflection can help you notice what you need,
                without having to solve everything at once.
              </p>
              <a href="#companion" className="next-link">
                Open your companion <ArrowUpRight size={15} />
              </a>
            </div>
          </aside>
        </section>

        <section className="compass-section" id="compass">
          <div className="compass-heading">
            <div>
              <div className="eyebrow">02 / YOUR EMOTIONAL PATTERNS</div>
              <h2>Emotional Compass</h2>
              <p>
                A gentle look at what you've recorded over the last seven days.
              </p>
            </div>

            <div className="compass-private">
              <LockKeyhole size={13} />
              CALCULATED ON THIS DEVICE
            </div>
          </div>

          {compass.total === 0 ? (
            <div className="compass-empty panel">
              <Compass size={25} />
              <h3>Your compass starts with a check-in.</h3>
              <p>
                As you record how you're feeling, this space will help you
                notice patterns in your own words and experiences.
              </p>
              <a href="#reflection" className="next-link">
                Record your first check-in <ArrowUpRight size={15} />
              </a>
            </div>
          ) : (
            <>
              <div className="compass-stats">
                <div className="compass-stat panel">
                  <span className="stat-label">CHECK-INS</span>
                  <strong>{compass.total}</strong>
                  <span className="stat-caption">Last 7 days</span>
                </div>

                <div className="compass-stat panel">
                  <span className="stat-label">AVERAGE INTENSITY</span>
                  <strong>
                    {compass.averageIntensity.toFixed(1)}
                    <small>/5</small>
                  </strong>
                  <span className="stat-caption">Self-reported</span>
                </div>

                <div className="compass-stat panel">
                  <span className="stat-label">MOST RECORDED</span>
                  <strong className="stat-mood">
                    {compass.dominantMood
                      ? MOOD_LABELS[compass.dominantMood[0]]
                      : 'Not available'}
                  </strong>
                  <span className="stat-caption">
                    {compass.dominantMood
                      ? `${compass.dominantMood[1]} recorded check-ins`
                      : 'No recognised mood entries'}
                  </span>
                </div>
              </div>

              <div className="compass-grid">
                <div className="compass-card panel">
                  <div className="compass-card-heading">
                    <div>
                      <div className="eyebrow">MOOD DISTRIBUTION</div>
                      <h3>What you've recorded</h3>
                    </div>
                    <span>7 DAYS</span>
                  </div>

                  <div className="mood-distribution">
                    {Object.entries(compass.moodCounts).map(
                      ([emotion, count]) => (
                        <div className="mood-distribution-row" key={emotion}>
                          <span>{MOOD_LABELS[emotion]}</span>
                          <div className="distribution-track">
                            <div
                              className={`distribution-fill mood-${emotion}`}
                              style={{
                                width: `${(count / compass.total) * 100}%`
                              }}
                            />
                          </div>
                          <strong>{count}</strong>
                        </div>
                      )
                    )}
                  </div>

                  <p className="compass-footnote">
                    Counts reflect your recorded check-ins, not how you felt
                    every moment of the day.
                  </p>
                </div>

                <div className="compass-card panel">
                  <div className="compass-card-heading">
                    <div>
                      <div className="eyebrow">INTENSITY OVER TIME</div>
                      <h3>Your daily average</h3>
                    </div>
                    <span>1–5 SCALE</span>
                  </div>

                  <div className="intensity-chart">
                    {compass.dailyIntensity.map(day => (
                      <div className="intensity-day" key={day.date}>
                        <div className="intensity-bar-area">
                          {day.average !== null ? (
                            <div
                              className="intensity-bar"
                              style={{
                                height: `${day.average * 20}%`
                              }}
                              title={`${day.average.toFixed(1)}/5 · ${day.count} check-in(s)`}
                            />
                          ) : (
                            <div className="intensity-bar-empty" />
                          )}
                        </div>

                        <span className="intensity-day-label">
                          {day.label}
                        </span>

                        <span className="intensity-day-value">
                          {day.average !== null
                            ? day.average.toFixed(1)
                            : '–'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="compass-footnote">
                    Days without a check-in are left blank, not treated as zero.
                  </p>
                </div>
              </div>

              <div className="compass-observation">
                <div className="observation-mark">
                  <Compass size={18} />
                </div>
                <div>
                  <div className="eyebrow">A GENTLE OBSERVATION</div>
                  <p>
                    {compass.total === 1
                      ? "You've recorded one check-in so far. Keep checking in whenever it feels useful. Patterns take time to emerge."
                      : compass.dominantMood
                        ? `You've recorded ${compass.total} check-ins over the last seven days. Your most frequently recorded mood is ${MOOD_LABELS[compass.dominantMood[0]].toLowerCase()}. This is simply a summary of your entries, not a definition of how you're doing.`
                        : `You've recorded ${compass.total} check-ins over the last seven days. This is a summary of your entries, not a definition of how you're doing.`}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="companion-section" id="companion">
          <div className="companion-heading">
            <div>
              <div className="eyebrow">03 / A CONVERSATION, AT YOUR PACE</div>
              <h2>A space to talk it through.</h2>
            </div>

            <div className="language-tag">
              <AudioLines size={14} />
              বাংলা · BANGLISH · ENGLISH
            </div>
          </div>

          <div className="chat-layout">
            <div className="chat-main panel">
              <div className="chat-top">
                <div className="assistant-id">
                  <span className="assistant-avatar">
                    <Heart size={17} />
                  </span>

                  <span>
                    <b>MonBondhu</b>
                    <small>EMOTIONAL SUPPORT COMPANION</small>
                  </span>
                </div>

                <div className="chat-actions">
                  <button
                    className="help-button"
                    type="button"
                    onClick={clearConversation}
                    disabled={sending}
                    aria-label="Clear conversation"
                    title="Clear conversation"
                  >
                    <Trash2 size={16} />
                  </button>

                  <span className="online-label">
                    <i /> READY TO LISTEN
                  </span>
                </div>
              </div>

              <div className="mood-sharing">
                <label>
                  <input
                    type="checkbox"
                    checked={shareMoodContext}
                    onChange={event =>
                      setShareMoodContext(event.target.checked)
                    }
                    disabled={compass.total === 0}
                  />
                  <span>Share my mood patterns with MonBondhu</span>
                </label>

                <p>
                  {compass.total === 0
                    ? 'Record a check-in before sharing mood patterns.'
                    : 'Optional. Shares only your last 7 days of mood counts and average intensity. Your personal notes are never included.'}
                </p>
              </div>

              <div className="messages" aria-live="polite">
                {messages.map((item, i) => (
                  <div
                    key={i}
                    className={`message-row ${item.role === 'user' ? 'from-user' : ''}`}
                  >
                    <div
                      className={`message-bubble ${item.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}
                    >
                      {item.text}

                      {item.safety === 'urgent_review' && (
                        <div className="safety-flag">
                          <ShieldCheck size={13} />
                          HUMAN SUPPORT PRIORITY
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="message-row">
                    <div className="typing">
                      <i /><i /><i />
                      <span>Thinking carefully</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="error-line" role="alert">
                  {error}
                </div>
              )}

              <form className="composer" onSubmit={sendMessage}>
                <input
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="Write in the language that feels natural..."
                  aria-label="Your message"
                />

                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!message.trim() || sending}
                >
                  {sending
                    ? <span className="spinner" />
                    : <Send size={17} />}
                </button>
              </form>

              <div className="chat-disclaimer">
                <LockKeyhole size={12} />
                Avoid sharing identifying details. This is not professional
                or emergency care.
              </div>
            </div>

            <aside className="chat-aside">
              <div className="aside-label">YOU CAN START WITH</div>

              {[
                'I feel overwhelmed lately',
                'I need help with a relationship',
                'I want to understand my emotions'
              ].map((s, i) => (
                <button
                  className="prompt"
                  key={i}
                  type="button"
                  onClick={() => setMessage(s)}
                >
                  <span>0{i + 1}</span>
                  {s}
                  <ArrowUpRight size={14} />
                </button>
              ))}

              <div className="safety-card">
                <ShieldCheck size={18} />
                <b>Your safety comes first.</b>
                <p>
                  If you may be in immediate danger, contact local emergency
                  services or go to the nearest emergency department.
                  Reach out to someone you trust who can stay with you.
                </p>
                <a href="#support">
                  Support information <ArrowUpRight size={13} />
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="support-strip" id="support">
          <div className="support-icon">
            <Leaf size={19} />
          </div>

          <div>
            <div className="eyebrow">04 / WHEN YOU NEED MORE SUPPORT</div>
            <h3>You don't have to do this alone.</h3>
            <p>
              MonBondhu is a companion for reflection, not a replacement
              for professional care. A qualified person can help you work
              through difficult moments.
            </p>
          </div>

          <a
            href="https://www.who.int/health-topics/mental-health"
            target="_blank"
            rel="noreferrer"
          >
            Explore mental health information <ArrowUpRight size={15} />
          </a>
        </section>

        <footer>
          <span>
            MONBONDHU<span className="brand-period">.</span> / BUILT WITH CARE
          </span>
          <span>
            PREVIEW BUILD · NO ACCOUNT · CHECK-INS STORED LOCALLY
          </span>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
