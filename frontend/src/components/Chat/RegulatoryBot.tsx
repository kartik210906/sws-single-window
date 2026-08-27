// frontend/src/components/Chat/RegulatoryBot.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Source {
  authority: string;
  category: string;
  state: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: Source[];
}

export default function RegulatoryBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your Single Window Compliance Assistant. Tell me about your business setup plans (e.g., "I am opening a chemical plant in Pune"), and I will generate your custom approvals checklist.'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Add user query to conversation history
    const updatedMessages = [...messages, { sender: 'user', text: queryText } as Message];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to fetch compliance checklist.');

      // Add response answers and metadata sources to conversation history
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.answer,
          sources: data.sources
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `🚨 System Error: ${err.message || 'Unable to contact compliance services.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Safe client-side Markdown rendering converter
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-md font-bold text-gray-900 mt-4 mb-1">{line.slice(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-lg font-bold text-gray-900 mt-5 mb-2 border-b pb-1">{line.slice(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h2>;
      }

      // Bold text formatting
      let formattedLine: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        formattedLine = parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-gray-900 font-bold">{part}</strong> : part));
      }

      // Checkbox list items
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const checked = line.trim().startsWith('- [x]');
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 pl-4">
            <input type="checkbox" checked={checked} disabled className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
            <span className="text-gray-700 text-sm">{line.trim().slice(6)}</span>
          </div>
        );
      }

      // Bullet List items
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <li key={idx} className="list-disc list-inside text-gray-700 text-sm pl-4 my-1">
            {formattedLine}
          </li>
        );
      }

      // Numbered List items
      const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-1.5 pl-2 text-sm text-gray-700">
            <span className="font-bold text-blue-600">{numberedMatch[1]}.</span>
            <span>{numberedMatch[2]}</span>
          </div>
        );
      }

      // Normal lines
      return line.trim() ? (
        <p key={idx} className="text-sm text-gray-700 leading-relaxed my-2">{formattedLine}</p>
      ) : (
        <div key={idx} className="h-2" />
      );
    });
  };

  const starterQuestions = [
    "I am opening a chemical plant in Pune, what do I need?",
    "Opening an IT Consulting Office in Hinjewadi, Pune",
    "Requirements for building a food processing factory in Maharashtra"
  ];

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[70vh]">
      {/* Bot Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <span>SWS Smart Assistant</span>
            <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
          </h2>
          <p className="text-xs text-blue-100">National Single Window System Regulatory Bot</p>
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
            }`}>
              {/* Message content */}
              <div className="prose prose-sm max-w-none">
                {msg.sender === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>{formatMarkdown(msg.text)}</div>
                )}
              </div>

              {/* RAG Sources Metadata Box */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-150">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Retrieved Document Context:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {msg.sources.map((src, sIdx) => (
                      <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border">
                        {src.authority} ({src.state})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center space-x-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Starter Buttons */}
      {messages.length === 1 && (
        <div className="px-6 py-3 bg-gray-100 border-t flex flex-wrap gap-2 justify-center">
          {starterQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-gray-200 text-blue-700 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Inputs Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 bg-white border-t flex items-center space-x-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about required approvals (e.g., 'I want to open a paint factory...')"
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg shadow transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
