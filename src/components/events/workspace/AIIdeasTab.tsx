import { Sparkles, Loader2, Send } from "lucide-react";
import { PersonalizedIdea } from "@/lib/types";
import { ChatResponseState } from "@/hooks/useEventWorkspace";

export interface AIIdeasTabProps {
  ideas: PersonalizedIdea[];
  filteredIdeas: PersonalizedIdea[];
  ideaFilter: string;
  setIdeaFilter: (filter: string) => void;
  eventCity: string;
  chatPrompt: string;
  setChatPrompt: (prompt: string) => void;
  chatLoading: boolean;
  chatResponse: ChatResponseState | null;
  onRefineSubmit: (customPrompt?: string, applyAction?: boolean) => Promise<void>;
}

export function AIIdeasTab({
  filteredIdeas,
  ideaFilter,
  setIdeaFilter,
  eventCity,
  chatPrompt,
  setChatPrompt,
  chatLoading,
  chatResponse,
  onRefineSubmit,
}: AIIdeasTabProps) {
  return (
    <div
      role="tabpanel"
      id="tabpanel-ai"
      aria-labelledby="tab-ai"
      tabIndex={0}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Ideas & Suggestions</h2>
        <p className="text-sm text-gray-500">Personalized recommendations based on your event requirements</p>
      </div>

      {/* Idea Category Pills */}
      <div className="flex flex-wrap gap-2">
        {["All Ideas", "Theme Ideas", "Decoration", "Food & Menu", "Activities", "Saving Tips"].map((cat) => {
          const active = ideaFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setIdeaFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredIdeas.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            No ideas found under &ldquo;{ideaFilter}&rdquo;.
          </div>
        ) : (
          filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
            >
              {/* Decorative top strip by section */}
              <div
                className={`h-1.5 ${
                  idea.section === "theme"
                    ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899]"
                    : idea.section === "food"
                    ? "bg-gradient-to-r from-[#F59E0B] to-[#EF4444]"
                    : idea.section === "decor"
                    ? "bg-gradient-to-r from-[#10B981] to-[#3B82F6]"
                    : "bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                }`}
              />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] uppercase tracking-wide">
                    {idea.section}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{idea.costTier}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{idea.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{idea.description}</p>
                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Assistant Chat */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#7C3AED]" />
            <span>AI Assistant</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Ask anything about your event in English, Hindi, or Hinglish</p>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2">
          {[
            "Suggest decoration ideas for a wedding under ₹50,000",
            "Reduce my estimated event budget by 15%",
            "Suggest eco-friendly alternatives",
            `Regional food counters for ${eventCity}`,
          ].map((q) => (
            <button
              key={q}
              onClick={() => {
                setChatPrompt(q);
                void onRefineSubmit(q);
              }}
              className="text-xs bg-[#F9FAFB] border border-gray-200 text-gray-700 hover:bg-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED] px-3 py-1.5 rounded-xl transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatPrompt}
            aria-label="Ask celebration assistant"
            onChange={(e) => setChatPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void onRefineSubmit()}
            placeholder="Ask anything... (English, Hindi, or Hinglish)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7C3AED] text-sm focus:outline-none"
          />
          <button
            onClick={() => void onRefineSubmit()}
            disabled={chatLoading || !chatPrompt.trim()}
            aria-label="Send query to AI celebration assistant"
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Response */}
        {chatResponse && (
          <div className="bg-[#F9FAFB] rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold text-gray-700">UtsavMate AI</span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  chatResponse.source === "gemini" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-gray-100 text-gray-500"
                }`}
              >
                {chatResponse.source === "gemini" ? "Gemini AI" : "Offline Engine"}
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{chatResponse.answer}</p>
            {chatResponse.suggestedAction?.type === "adjust_budget" && (
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Apply this budget reduction to saved records?</span>
                <button
                  onClick={() => void onRefineSubmit(chatPrompt, true)}
                  className="bg-[#10B981] text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Apply Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
