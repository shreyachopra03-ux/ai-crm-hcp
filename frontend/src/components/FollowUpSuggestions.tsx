interface FollowUpSuggestionsProps {
  items: string[];
}

export default function FollowUpSuggestions({ items }: FollowUpSuggestionsProps) {
  if (!items.length) return null;

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-lg">🎯</span> Suggested Follow-ups
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-0.5 h-5 w-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
