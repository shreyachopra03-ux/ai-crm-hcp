import { useState, useRef, useEffect, FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import { addUserMessage, sendMessage, clearChat } from "../store/chatSlice";
import toast from "react-hot-toast";

const SUGGESTIONS = [
  "Log a visit with Dr. Sharma about diabetes drug",
  "Search for Dr. Patel interactions",
  "Suggest follow-ups for my last meeting",
  "Summarize: met doctor, discussed oncology trial",
];

export default function ChatAssistant() {
  const dispatch = useAppDispatch();
  const { messages, loading } = useAppSelector((s) => s.chat);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    dispatch(addUserMessage(msg));
    try {
      await dispatch(sendMessage(msg)).unwrap();
    } catch {
      toast.error("Failed to get AI response");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-200">
              <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none">AI Assistant</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Powered by Groq · gpt-oss-20b</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(clearChat())}
          className="btn-ghost text-xs text-gray-400"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      {/* ── Messages ────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 animate-fade-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Avatar for assistant */}
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}

            <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-br-sm shadow-sm shadow-brand-200"
                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>

              {/* Tool call chips */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1">
                  {msg.toolCalls.map((tc, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-brand-100"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      {(tc as Record<string, unknown>).tool as string || "tool"}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar for user */}
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 justify-start animate-fade-in-up">
            <div className="h-7 w-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="h-2 w-2 bg-brand-400 rounded-full dot-bounce" />
                <span className="h-2 w-2 bg-brand-400 rounded-full dot-bounce" />
                <span className="h-2 w-2 bg-brand-400 rounded-full dot-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick suggestions ────────────────── */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Try asking...</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-left text-xs text-gray-600 bg-white border border-gray-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 rounded-lg px-3 py-2 transition-all duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ────────────────────────────── */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            className="input-field flex-1 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to log, search, edit, summarize..."
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-primary px-4 flex-shrink-0"
            disabled={!input.trim() || loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
