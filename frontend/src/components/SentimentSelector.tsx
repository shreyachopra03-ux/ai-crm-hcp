interface SentimentSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

const sentiments = [
  { label: "Positive", icon: "👍", active: "bg-emerald-500 text-white shadow-sm shadow-emerald-200 border-emerald-500", dot: "bg-emerald-500" },
  { label: "Neutral",  icon: "😐", active: "bg-amber-400 text-white shadow-sm shadow-amber-200 border-amber-400",   dot: "bg-amber-400"  },
  { label: "Negative", icon: "👎", active: "bg-red-500 text-white shadow-sm shadow-red-200 border-red-500",         dot: "bg-red-500"    },
];

export default function SentimentSelector({ value, onChange }: SentimentSelectorProps) {
  return (
    <div className="flex gap-2">
      {sentiments.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onChange(s.label)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
            value === s.label
              ? s.active
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="text-base leading-none">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
