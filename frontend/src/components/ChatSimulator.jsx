import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Database, Edit3, Briefcase, HelpCircle, Cpu, Clock, Layers } from 'lucide-react';

const INTENT_PRESETS = [
  { label: 'code', icon: Terminal, color: 'code', placeholder: 'Sort a Python list...' },
  { label: 'data', icon: Database, color: 'data', placeholder: 'Calculate averages...' },
  { label: 'writing', icon: Edit3, color: 'writing', placeholder: 'Writing feedback...' },
  { label: 'career', icon: Briefcase, color: 'career', placeholder: 'Interview tips...' },
];

const EXPERT_DETAILS = {
  code: {
    title: 'Code Expert',
    model: 'llama-3.1-8b-instant',
    role: 'Provides production-quality code. Minimal explanations, code-only focus, robust error handling, typing support.',
    latency: '180ms',
  },
  data: {
    title: 'Data Expert',
    model: 'llama-3.1-8b-instant',
    role: 'Interprets patterns, explains step-by-step math calculations, recommends statistical concepts and charts.',
    latency: '240ms',
  },
  writing: {
    title: 'Writing Coach',
    model: 'llama-3.1-8b-instant',
    role: 'Analyzes clarity, tone, and grammar. Explains suggestions without rewriting directly for user guidance.',
    latency: '210ms',
  },
  career: {
    title: 'Career Advisor',
    model: 'llama-3.1-8b-instant',
    role: 'Pragmatic career advice. Demands goals and experiences beforehand, focusing on actionable certifications.',
    latency: '280ms',
  },
  unclear: {
    title: 'Clarification Assistant',
    model: 'llama-3.1-8b-instant',
    role: 'Friendly assistant asking targeted follow-up queries. Steers user towards supported expert domains.',
    latency: '150ms',
  },
};

export default function ChatSimulator() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'system',
      text: "I'd love to help! Tell me what you need assistance with. I specialize in coding, data analysis, writing feedback, and career advice.",
      intent: 'unclear',
      confidence: 1.0,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedOverride, setSelectedOverride] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpert, setCurrentExpert] = useState('unclear');
  const [lastLatency, setLastLatency] = useState('0ms');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Add user message
    const userMsgId = Date.now().toString();
    const formattedMessage = selectedOverride ? `@${selectedOverride} ${text}` : text;
    
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: 'user',
      text: formattedMessage,
      overrideIntent: selectedOverride,
    }]);

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: formattedMessage })
      });

      const latencyMs = Math.round(performance.now() - startTime);
      setLastLatency(`${latencyMs}ms`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to communicate with prompt router.');
      }

      const data = await response.json();
      
      // Update active expert panel
      setCurrentExpert(data.intent);

      // Add AI Response
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.response,
        intent: data.intent,
        confidence: data.confidence,
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'system-error',
        text: `Error: ${error.message}. Please check your server and GROQ_API_KEY environment variable setup.`,
        intent: 'unclear',
        confidence: 0.0,
      }]);
    } finally {
      setIsLoading(false);
      setSelectedOverride(null);
    }
  };

  const handleSuggestionClick = (preset) => {
    let suggestionText = '';
    switch (preset) {
      case 'code': suggestionText = 'How do I reverse a linked list in Python?'; break;
      case 'data': suggestionText = 'What is the median of [12, 15, 23, 27, 33, 45, 90]?'; break;
      case 'writing': suggestionText = 'Can you review my introductory email to a client?'; break;
      case 'career': suggestionText = 'What certifications should I look into for becoming a cloud architect?'; break;
      default: suggestionText = '';
    }
    handleSend(suggestionText);
  };

  const activeExpert = EXPERT_DETAILS[currentExpert] || EXPERT_DETAILS.unclear;

  return (
    <div className="screen-layout animate-fade-in">
      <div className="screen-panel">
        <div className="screen-header">
          <div className="screen-title">
            <h2>Chat Simulator</h2>
            <p>Interactively route prompts and simulate intent classification</p>
          </div>
          <div className="expert-header-badge glass-panel">
            <span className="pulsing-dot" />
            <span>Active Expert: </span>
            <strong style={{ textTransform: 'uppercase', color: 'var(--color-primary)' }}>
              {currentExpert}
            </strong>
          </div>
        </div>

        {/* Chat History Panel */}
        <div className="chat-history-container glass-panel flex-grow">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                {msg.sender === 'user' ? (
                  <div className="user-message-card">
                    {msg.overrideIntent && (
                      <span className="manual-override-indicator">
                        Override: @{msg.overrideIntent}
                      </span>
                    )}
                    <p>{msg.text}</p>
                  </div>
                ) : msg.sender === 'system-error' ? (
                  <div className="system-error-card">
                    <p>{msg.text}</p>
                  </div>
                ) : (
                  <div className="ai-message-card">
                    <div className="ai-message-header">
                      <div className={`intent-badge ${msg.intent}`}>
                        {msg.intent === 'code' && <Terminal size={12} />}
                        {msg.intent === 'data' && <Database size={12} />}
                        {msg.intent === 'writing' && <Edit3 size={12} />}
                        {msg.intent === 'career' && <Briefcase size={12} />}
                        {msg.intent === 'unclear' && <HelpCircle size={12} />}
                        {msg.intent}
                      </div>
                      <span className="metadata-tag">
                        Confidence: {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="ai-message-body">
                      {msg.text.split('\n').map((line, idx) => (
                        <p key={idx} className={line.startsWith('```') ? 'code-line' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="message-row ai">
                <div className="ai-message-card typing">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestion pills if no history yet */}
        {messages.length === 1 && !isLoading && (
          <div className="suggestions-grid">
            {INTENT_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              return (
                <button
                  key={preset.label}
                  className="suggestion-card glass-panel"
                  onClick={() => handleSuggestionClick(preset.label)}
                >
                  <IconComp className={`preset-icon ${preset.color}`} size={16} />
                  <span>{preset.placeholder}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom controls & input */}
        <div className="chat-controls-container glass-panel">
          <div className="manual-overrides-bar">
            <span className="bar-label">Override routing:</span>
            <div className="pills-row">
              {['code', 'data', 'writing', 'career'].map((intent) => (
                <button
                  key={intent}
                  onClick={() => setSelectedOverride(selectedOverride === intent ? null : intent)}
                  className={`override-pill ${intent} ${selectedOverride === intent ? 'active' : ''}`}
                >
                  @{intent}
                </button>
              ))}
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="input-form"
          >
            <input
              type="text"
              placeholder={
                selectedOverride
                  ? `Force route to ${selectedOverride} expert...`
                  : 'Type a message to classify & route...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="chat-input"
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={isLoading || !inputValue.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Drawer showing current expert details */}
      <div className="expert-drawer glass-panel">
        <div className="drawer-section">
          <h3>Active Persona</h3>
          <p className="drawer-subtitle">Current Routed Assistant</p>
        </div>

        <div className="active-expert-profile">
          <div className="profile-card">
            <div className="avatar">
              <Cpu size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h4>{activeExpert.title}</h4>
              <span className="model-label">{activeExpert.model}</span>
            </div>
          </div>

          <div className="detail-row">
            <Layers size={14} className="detail-icon" />
            <div>
              <span className="detail-title">System Role</span>
              <p className="detail-desc">{activeExpert.role}</p>
            </div>
          </div>

          <div className="detail-row">
            <Clock size={14} className="detail-icon" />
            <div>
              <span className="detail-title">Last Execution Latency</span>
              <p className="detail-desc mono">{lastLatency === '0ms' ? activeExpert.latency : lastLatency}</p>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <p>Model: llama-3.1-8b-instant</p>
          <p>Confidence Threshold: 0.70</p>
        </div>
      </div>
    </div>
  );
}
