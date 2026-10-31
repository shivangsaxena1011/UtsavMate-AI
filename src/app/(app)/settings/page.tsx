"use client";
import { useState } from "react";
import { User, Mail, Bell, Shield, Globe, ChevronRight, Check } from "lucide-react";

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-[#7C3AED]" />
            Profile Management
          </h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-white text-xl font-bold">
              U
            </div>
            <div>
              <p className="font-bold text-gray-900">Default User</p>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> user@utsavmate.ai
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              <input
                type="text"
                defaultValue="Default User"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#7C3AED] text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input
                type="email"
                defaultValue="user@utsavmate.ai"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#7C3AED] text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Language Preference */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-[#EC4899]" />
            Language Preference
          </h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs text-gray-500">Choose the language for AI suggestions and planning ideas.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "en", label: "English", sub: "Default" },
              { id: "hi", label: "हिंदी", sub: "Hindi" },
              { id: "hinglish", label: "Hinglish", sub: "Conversational" },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  language === lang.id
                    ? "border-[#7C3AED] bg-[#EDE9FE]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-bold text-sm text-gray-900">{lang.label}</p>
                <p className="text-xs text-gray-400">{lang.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-[#F59E0B]" />
            Account Security
          </h2>
        </div>
        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Change Password</p>
            <p className="text-xs text-gray-400">Update your account password</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4 text-[#10B981]" />
            Notification Settings
          </h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          {["Task deadline reminders", "Budget overspend alerts", "Vendor follow-up reminders"].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item}</span>
              <div className="w-10 h-5 rounded-full bg-[#7C3AED] flex items-center justify-end pr-0.5 cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
            saved ? "bg-[#10B981] text-white" : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
