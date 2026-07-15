import { useState, FormEvent, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import { createInteraction, fetchInteractions, clearChatFormData } from "../store/interactionsSlice";
import SentimentSelector from "./SentimentSelector";
import toast from "react-hot-toast";

const interactionTypes = [
  "In-Person Visit",
  "Virtual Meeting",
  "Phone Call",
  "Conference",
  "Lunch & Learn",
  "Other",
];

const defaultForm = () => ({
  hcp_name: "",
  interaction_type: "In-Person Visit",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 8),
  attendees: "",
  topics_discussed: "",
  materials_shared: "",
  samples_distributed: "",
  sentiment: "Neutral",
  outcomes: "",
  follow_up_actions: "",
});

export default function LogInteractionForm({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const chatFormData = useAppSelector((s) => s.interactions.chatFormData);

  const [form, setForm] = useState(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!chatFormData) return;

    const filled = new Set<string>();
    setForm((prev) => {
      const next = { ...prev };
      (Object.keys(chatFormData) as (keyof typeof chatFormData)[]).forEach((key) => {
        const val = chatFormData[key];
        if (val != null && val !== "") {
          (next as Record<string, string>)[key] = val;
          filled.add(key);
        }
      });
      return next;
    });
    setAutoFilled(filled);

    toast.success(`Form auto-filled from chat! ${filled.size} field(s) updated.`, {
      icon: "✨",
      duration: 3000,
    });

    dispatch(clearChatFormData());
  }, [chatFormData, dispatch]);

  useEffect(() => {
    if (autoFilled.size === 0) return;
    const timer = setTimeout(() => setAutoFilled(new Set()), 4000);
    return () => clearTimeout(timer);
  }, [autoFilled]);

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));

    setAutoFilled((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.hcp_name.trim()) {
      toast.error("HCP name is required");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(createInteraction(form)).unwrap();
      toast.success("Interaction logged successfully!");
      dispatch(fetchInteractions());
      setForm(defaultForm());
      setAutoFilled(new Set());
      onClose();
    } catch {
      toast.error("Failed to log interaction");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field: string) =>
    `input-field transition-colors duration-300 ${
      autoFilled.has(field)
        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400"
        : ""
    }`;

  const textareaClass = (field: string) =>
    `textarea-field transition-colors duration-300 ${
      autoFilled.has(field)
        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400"
        : ""
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {autoFilled.size > 0 && (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2 text-xs text-brand-700">
          <span>✨</span>
          <span>Fields highlighted in blue were auto-filled from your chat message.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">HCP Name *</label>
          <input
            className={fieldClass("hcp_name")}
            value={form.hcp_name}
            onChange={set("hcp_name")}
            placeholder="Dr. Smith"
            required
          />
        </div>
        <div>
          <label className="label">Interaction Type</label>
          <select className={fieldClass("interaction_type")} value={form.interaction_type} onChange={set("interaction_type")}>
            {interactionTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className={fieldClass("date")} value={form.date} onChange={set("date")} />
        </div>
        <div>
          <label className="label">Time</label>
          <input type="time" className={fieldClass("time")} value={form.time} onChange={set("time")} step="1" />
        </div>
      </div>

      <div>
        <label className="label">Attendees</label>
        <input
          className={fieldClass("attendees")}
          value={form.attendees}
          onChange={set("attendees")}
          placeholder="Dr. Jane, Nurse John"
        />
      </div>

      <div>
        <label className="label">Topics Discussed</label>
        <textarea
          className={textareaClass("topics_discussed")}
          rows={3}
          value={form.topics_discussed}
          onChange={set("topics_discussed")}
          placeholder="New drug efficacy, patient outcomes..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Materials Shared</label>
          <textarea
            className={textareaClass("materials_shared")}
            rows={2}
            value={form.materials_shared}
            onChange={set("materials_shared")}
            placeholder="Product brochure, clinical data..."
          />
        </div>
        <div>
          <label className="label">Samples Distributed</label>
          <textarea
            className={textareaClass("samples_distributed")}
            rows={2}
            value={form.samples_distributed}
            onChange={set("samples_distributed")}
            placeholder="Sample pack x2..."
          />
        </div>
      </div>

      <div>
        <label className="label">Sentiment</label>
        <div className={autoFilled.has("sentiment") ? "rounded-lg ring-1 ring-brand-400 bg-brand-50 p-1" : ""}>
          <SentimentSelector
            value={form.sentiment}
            onChange={(val) => {
              setForm((p) => ({ ...p, sentiment: val }));
              setAutoFilled((prev) => { const n = new Set(prev); n.delete("sentiment"); return n; });
            }}
          />
        </div>
      </div>

      <div>
        <label className="label">Outcomes</label>
        <textarea
          className={textareaClass("outcomes")}
          rows={2}
          value={form.outcomes}
          onChange={set("outcomes")}
          placeholder="HCP interested in trial..."
        />
      </div>

      <div>
        <label className="label">Follow-up Actions</label>
        <textarea
          className={textareaClass("follow_up_actions")}
          rows={2}
          value={form.follow_up_actions}
          onChange={set("follow_up_actions")}
          placeholder="Schedule follow-up call in 2 weeks..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Log Interaction"}
        </button>
      </div>
    </form>
  );
}
