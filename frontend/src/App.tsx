import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/store";
import {
  fetchInteractions,
  setSearchQuery,
  setSentimentFilter,
  deleteInteraction,
} from "./store/interactionsSlice";
import LogInteractionForm from "./components/LogInteractionForm";
import ChatAssistant from "./components/ChatAssistant";
import toast, { Toaster } from "react-hot-toast";

export default function App() {
  const dispatch = useAppDispatch();
  const { items, loading, searchQuery, sentimentFilter, chatFormData } =
    useAppSelector((s) => s.interactions);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    dispatch(
      fetchInteractions({
        search: searchQuery || undefined,
        sentiment: sentimentFilter || undefined,
      })
    );
  }, [dispatch, searchQuery, sentimentFilter]);

  // Auto-show form when AI extracts form data from chat
  useEffect(() => {
    if (chatFormData) setShowForm(true);
  }, [chatFormData]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this interaction?")) return;
    try {
      await dispatch(deleteInteraction(id)).unwrap();
      toast.success("Interaction deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const sentimentBadge = (s: string | null) => {
    if (s === "Positive") return <span className="badge-positive">● Positive</span>;
    if (s === "Negative") return <span className="badge-negative">● Negative</span>;
    return <span className="badge-neutral">● Neutral</span>;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: "13px", fontFamily: "Inter, sans-serif" },
        }}
      />

      {/* ── Header ───────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
        <div className="px-5 flex items-center justify-between h-14">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-gray-900 leading-none">AI-First CRM</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">HCP Interaction Manager</p>
            </div>
          </div>

          {/* Stats pill */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              AI Agent Active
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-semibold text-gray-700">{items.length}</span> interactions
            </div>
          </div>

          {/* Toggle form */}
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showForm
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showForm ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hide Form
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Log Interaction
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* Left panel: Form + Interactions list */}
        <div
          className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
            showForm ? "w-[58%]" : "w-[46%]"
          }`}
        >
          {/* Form section */}
          {showForm && (
            <div className="border-b border-gray-100 overflow-y-auto"
              style={{ maxHeight: "48%" }}>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="section-title">New Interaction</h2>
                    <p className="section-subtitle mt-0.5">Fill manually or let AI auto-fill from chat</p>
                  </div>
                  <span className="text-[10px] bg-brand-50 text-brand-600 font-semibold px-2 py-1 rounded-full">
                    ✨ AI Auto-Fill
                  </span>
                </div>
                <LogInteractionForm onClose={() => setShowForm(false)} />
              </div>
            </div>
          )}

          {/* Interactions list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-4">
              {/* List header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="section-title">Interaction History</h2>
                  <p className="section-subtitle mt-0.5">
                    {loading ? "Loading..." : `${items.length} records found`}
                  </p>
                </div>
                <button
                  onClick={() => dispatch(fetchInteractions({}))}
                  className="btn-ghost text-xs"
                  title="Refresh"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                  </svg>
                  <input
                    className="input-field pl-8 text-xs"
                    placeholder="Search HCPs, topics, attendees..."
                    value={searchQuery}
                    onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  />
                </div>
                <select
                  className="input-field text-xs w-[120px] flex-shrink-0"
                  value={sentimentFilter}
                  onChange={(e) => dispatch(setSentimentFilter(e.target.value))}
                >
                  <option value="">All Sentiment</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>

              {/* Records */}
              {loading ? (
                <div className="flex flex-col items-center py-12 text-gray-400">
                  <svg className="w-8 h-8 mb-2 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-sm">Loading interactions...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-gray-400">
                  <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">No interactions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Use the form or chat to log your first interaction</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="card-hover animate-fade-in-up group"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Name + type + sentiment row */}
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {item.hcp_name}
                            </span>
                            <span className="badge-type">{item.interaction_type}</span>
                            {sentimentBadge(item.sentiment)}
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1.5">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {item.date}
                            </span>
                            <span>{item.time?.slice(0, 5)}</span>
                            {item.attendees && (
                              <span className="flex items-center gap-1 truncate">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                                </svg>
                                <span className="truncate max-w-[120px]">{item.attendees}</span>
                              </span>
                            )}
                          </div>

                          {/* Topics */}
                          {item.topics_discussed && (
                            <p className="text-xs text-gray-600 truncate leading-relaxed">
                              {item.topics_discussed}
                            </p>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all duration-150 p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: AI Chat */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <ChatAssistant />
        </div>
      </div>
    </div>
  );
}
