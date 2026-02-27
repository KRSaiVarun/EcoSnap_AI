import { useEffect, useState } from "react";

interface CarbonImpact {
  choice: string;
  co2_kg: number;
  alternative: string;
  alt_co2_kg: number;
  co2_saved: number;
  category: string;
}

interface AIResponse {
  reply: string;
  carbon_impact?: CarbonImpact;
  suggestions?: string[];
  confidence?: number;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch history if available
    fetch("/api/chat/history", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.history)) {
          const items = data.history.map((m: any) => ({
            role: m.role,
            text: m.content,
          }));
          setMessages(items);
        }
      })
      .catch(() => {});
  }, []);

  async function sendMessage() {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
        credentials: "include",
      });
      const data: AIResponse = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Eco Chat</h1>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block p-3 rounded ${m.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about an activity, e.g. 'I'm taking an Uber to work'"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
