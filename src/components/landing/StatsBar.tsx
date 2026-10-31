export function StatsBar() {
  return (
    <div className="bg-white border-b border-gray-100 py-4 px-4">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
        {[
          { value: "6+", label: "Event Types" },
          { value: "₹0", label: "Cost to Use" },
          { value: "AI", label: "Gemini-Powered" },
          { value: "∞", label: "Events Supported" },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-extrabold text-[#7C3AED]">{stat.value}</p>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
