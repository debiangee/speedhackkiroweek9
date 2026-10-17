import { generateBotResponse, type Message } from '../services/weather-assistant';
import { manilaHour } from '../utils/time';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  MapPinIcon,
  ThermometerIcon,
  DropletIcon,
  WindIcon,
  EyeIcon,
  AlertTriangleIcon,
  CloudSunIcon,
  SunIcon,
  CloudRainIcon,
  CloudLightningIcon,
  LightbulbIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  CarIcon,
  MotorcycleIcon,
  BusIcon,
  WalkingIcon,
  ShieldIcon,
  WavesIcon,
  UmbrellaIcon,
  StarIcon,
  CloudIcon,
  SparklesIcon,
} from './Icons';
import './WeatherChatbot.css';


function getGreeting() { return manilaHour() < 12 ? 'Magandang umaga!' : 'Kumusta!'; }
function getIconForEmoji(emoji: string, idx: number | string): React.ReactNode | null {
  switch (emoji) {
    case '📍':
      return <MapPinIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🌡️':
    case '🌡':
      return <ThermometerIcon key={idx} size={14} color="#f97316" className="inline-msg-svg" />;
    case '💧':
      return <DropletIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '💨':
      return <WindIcon key={idx} size={14} color="#0284c7" className="inline-msg-svg" />;
    case '👁️':
    case '👁':
      return <EyeIcon key={idx} size={14} color="var(--text-secondary)" className="inline-msg-svg" />;
    case '⚠️':
    case '⚠':
    case '🚨':
      return <AlertTriangleIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '⛅':
    case '🌤️':
    case '🌤':
      return <CloudSunIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '☀️':
      return <SunIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '🌧️':
    case '🌧':
    case '🌦️':
    case '🌦':
      return <CloudRainIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '⛈️':
    case '⛈':
      return <CloudLightningIcon key={idx} size={14} color="#6366f1" className="inline-msg-svg" />;
    case '💡':
      return <LightbulbIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '✅':
      return <CheckCircleIcon key={idx} size={14} color="#16a34a" className="inline-msg-svg" />;
    case '🛡️':
    case '🛡':
      return <ShieldIcon key={idx} size={14} color="#16a34a" className="inline-msg-svg" />;
    case '🌊':
      return <WavesIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '📅':
      return <CalendarIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '⏰':
    case '⏱️':
      return <ClockIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🚗':
    case '🚕':
      return <CarIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🏍️':
    case '🛵':
      return <MotorcycleIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🚌':
      return <BusIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '🚶':
    case '🚶‍♂️':
      return <WalkingIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '☂️':
    case '☔':
      return <UmbrellaIcon key={idx} size={14} color="#3b82f6" className="inline-msg-svg" />;
    case '⚔️':
    case '📈':
      return <TrendingUpIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    case '📉':
      return <TrendingUpIcon key={idx} size={14} color="#ef4444" className="inline-msg-svg" />;
    case '🥵':
      return <ThermometerIcon key={idx} size={14} color="#ef4444" className="inline-msg-svg" />;
    case '🌫️':
    case '🌫':
      return <CloudIcon key={idx} size={14} color="var(--text-muted)" className="inline-msg-svg" />;
    case '⭐':
    case '🌟':
      return <StarIcon key={idx} size={14} color="#f59e0b" className="inline-msg-svg" />;
    case '🤝':
      return <CheckCircleIcon key={idx} size={14} color="var(--accent)" className="inline-msg-svg" />;
    default:
      return null;
  }
}

const EMOJI_SPLIT_REGEX = /(📍|🌡️|🌡|💧|💨|👁️|👁|⚠️|⚠|🚨|⛅|🌤️|🌤|☀️|🌧️|🌧|🌦️|🌦|⛈️|⛈|💡|✅|🛡️|🛡|🌊|📅|⏰|⏱️|🚗|🚕|🏍️|🛵|🚌|🚶|🚶‍♂️|☂️|☔|⚔️|📈|📉|🥵|🌫️|🌫|⭐|🌟|🤝)/gu;

function renderRichMessageLine(line: string, key: number | string) {
  if (line.match(/^[─]{3,}$/)) {
    return <hr key={key} className="msg-divider" />;
  }

  const parts = line.split(EMOJI_SPLIT_REGEX);

  const renderedParts = parts.map((part, pIdx) => {
    const icon = getIconForEmoji(part, `${key}-${pIdx}`);
    if (icon) {
      return (
        <span key={pIdx} className="msg-icon-token" aria-hidden="true">
          {icon}
        </span>
      );
    }

    // Split for markdown bold **text**
    const boldParts = part.split(/\*\*(.+?)\*\*/g);
    return (
      <span key={pIdx}>
        {boldParts.map((bPart, bIdx) =>
          bIdx % 2 === 1 ? (
            <strong key={bIdx}>{bPart}</strong>
          ) : (
            <span key={bIdx}>{bPart}</span>
          )
        )}
      </span>
    );
  });

  return (
    <span key={key} className={`msg-line ${line.startsWith('  ') ? 'msg-indent' : ''}`}>
      {renderedParts}
    </span>
  );
}

export function WeatherChatbot({ selectedRegion, selectedCity }: { selectedRegion: string; selectedCity?: string | null }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: `📍 **${selectedRegion || 'Philippines'}**\n${getGreeting()} Ako si Kuya Weather — your everyday Philippine weather decision assistant.\n\nSubukan magtanong tungkol sa:\n• **Current-hour forecast & temperature** sa inyong lugar\n• **7-Day Rain & Thunderstorm** forecast\n• **Trip suitability & preparedness** advisory\n• **Side-by-Side Comparison** ng dalawang probinsya/cities`,
      followUps: [
        `Weather ngayon sa ${selectedRegion || 'NCR'}?`,
        `Uulan ba sa ${selectedRegion || 'Cebu'}?`,
        `Temperature at init sa ${selectedRegion || 'Maynila'}?`,
        `Safe ba mag-travel ngayon?`,
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) { previousFocus.current = document.activeElement as HTMLElement; inputRef.current?.focus(); }
    else previousFocus.current?.focus();
  }, [open]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const response = await generateBotResponse(msg, selectedRegion, selectedCity);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: response.text,
          followUps: response.followUps,
          realityAction: response.realityAction,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Ay naku, may error sa pag-connect! Try mo ulit, tol.',
          followUps: [
            `Weather ngayon sa ${selectedRegion}`,
            `Uulan ba mamaya?`,
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedRegion, selectedCity]);

  return (
    <>
      <button
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close weather chatbot' : 'Open weather chatbot'}
        title="Kuya Weather Chatbot"
      >
        {open ? (
          <XIcon size={24} color="white" />
        ) : (
          <MessageCircleIcon size={24} color="white" />
        )}
      </button>

      {open && (
        <div className="chatbot-panel" onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }} role="dialog" aria-label="Kuya Weather Assistant">
          <div className="chatbot-header">
            <div className="chatbot-header-branding">
              <div className="chatbot-avatar" aria-hidden="true">
                <BotIcon size={18} color="white" />
                <span className="chatbot-status-dot" />
              </div>
              <div>
                <h3 className="chatbot-title">Kuya Weather</h3>
                <span className="chatbot-subtitle">Rule-based forecast guide · Open-Meteo</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chatbot">
              <XIcon size={18} color="currentColor" />
            </button>
          </div>

          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg-wrapper ${msg.role}`}>
                <div className={`chatbot-msg ${msg.role}`}>
                  <div className="msg-label" aria-hidden="true">
                    {msg.role === 'bot' ? (
                      <>
                        <BotIcon size={13} color="var(--accent)" />
                        <span>Kuya Weather</span>
                      </>
                    ) : (
                      <>
                        <UserIcon size={13} color="currentColor" />
                        <span>You</span>
                      </>
                    )}
                  </div>
                  <div className="msg-content">
                    {msg.text.split('\n').map((line, j) => (
                      <div key={j} className="msg-line-wrapper">
                        {renderRichMessageLine(line, `${i}-${j}`)}
                      </div>
                    ))}
                  </div>

                  {msg.role === 'bot' && msg.realityAction && (
                    <div className="msg-reality-action">
                      <button
                        type="button"
                        className="reality-action-btn"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('weather-reality-trigger', {
                              detail: {
                                region: msg.realityAction?.region,
                                hourOffset: msg.realityAction?.hourOffset ?? 0,
                                city: msg.realityAction?.city,
                              },
                            })
                          );
                          const el = document.getElementById('weather-maps');
                          if (el) el.scrollIntoView({ behavior: 'instant' });
                        }}
                      >
                        <SparklesIcon size={13} color="var(--accent)" />
                        <span>{msg.realityAction.label}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Contextual Follow-Up Questions (Rendered on Bot Answers) */}
                {msg.role === 'bot' && msg.followUps && msg.followUps.length > 0 && i === messages.length - 1 && (
                  <div className="msg-follow-ups" role="group" aria-label="Suggested follow-up questions">
                    <span className="follow-up-caption">
                      <SparklesIcon size={11} color="var(--accent)" />
                      <span>Suggested Follow-up Questions:</span>
                    </span>
                    <div className="follow-up-chips">
                      {msg.followUps.map((q, idx) => (
                        <button
                          key={idx}
                          className="follow-up-chip"
                          onClick={() => handleSend(q)}
                          type="button"
                          disabled={loading}
                          title={`Ask: "${q}"`}
                        >
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chatbot-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span>Nag-a-analyze si Kuya Weather...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-row">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanong ka lang, tol... (e.g. Uulan ba sa Baguio?)"
              disabled={loading}
              aria-label="Type your weather question"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              type="button"
              aria-label="Send message"
            >
              <SendIcon size={16} color="white" />
              <span>Send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
