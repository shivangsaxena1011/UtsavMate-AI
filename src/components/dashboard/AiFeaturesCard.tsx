import { Sparkles, CheckCircle2 } from "lucide-react";

export function AiFeaturesCard() {
  return (
    <div className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-2xl p-5 text-white space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#EC4899]" />
        <span className="text-sm font-bold">AI Features Active</span>
      </div>
      <ul className="space-y-1.5 text-xs text-white/70">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Smart budget allocation
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Date-aware timeline
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Vendor management
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Gemini AI suggestions
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Hindi/Hinglish support
        </li>
      </ul>
    </div>
  );
}
