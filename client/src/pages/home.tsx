import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/use-decisions";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Car,
    Loader2,
    Send,
    ShoppingBag,
    Sparkles,
    Utensils
} from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp?: string }>
  >([]);

  const chatMutation = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    chatMutation.mutate(
      { message: input },
      {
        onSuccess: (data) => {
          // Add assistant response to chat
          const assistantMessage = {
            role: "assistant" as const,
            content: data.reply,
            timestamp: new Date().toISOString(),
          };
          setChatMessages((prev) => [...prev, assistantMessage]);
          setInput("");
        },
      },
    );
  };

  const handleExampleClick = (text: string) => {
    setInput(text);
  };

  const examples = [
    { icon: Utensils, text: "I'm ordering a beef burger for lunch" },
    { icon: Car, text: "Taking an Uber to work today" },
    { icon: ShoppingBag, text: "Buying a fast fashion t-shirt" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans pt-20 pb-12">
      <Header />

      <main className="container max-w-3xl mx-auto px-4 space-y-12">
        {/* Hero Section - Only show when no chat started */}
        {chatMessages.length === 0 && (
          <section className="text-center space-y-6 py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Sustainability Assistant</span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Make Better <br />
              <span className="text-gradient">Daily Decisions</span>
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Tell us about your daily choices—food, transport, or shopping.
              We'll analyze the carbon impact and suggest eco-friendly
              alternatives.
            </motion.p>
          </section>
        )}

        {/* Chat Messages Section */}
        <AnimatePresence>
          {chatMessages.length > 0 && (
            <motion.section
              className="space-y-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-xl ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-secondary text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm font-medium">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setChatMessages([]);
                    setInput("");
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Start New Chat
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Input Section */}
        <section className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
              <div className="relative bg-white rounded-2xl p-2 shadow-xl border border-border/50">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., I'm planning to drive to the grocery store..."
                  className="min-h-[120px] text-lg border-0 resize-none focus-visible:ring-0 p-4 bg-transparent placeholder:text-muted-foreground/50"
                  disabled={chatMutation.isPending}
                />
                <div className="flex justify-between items-center px-4 pb-2 pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground font-medium">
                    {input.length}/200 characters
                  </span>
                  <Button
                    type="submit"
                    disabled={!input.trim() || chatMutation.isPending}
                    className="rounded-xl px-6 py-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {chatMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        {chatMessages.length > 0 ? (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </>
                        ) : (
                          <>
                            Analyze Impact
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Quick Examples - Only show when no chat started */}
          {chatMessages.length === 0 && !chatMutation.isPending && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(ex.text)}
                  className="flex flex-col items-center p-4 rounded-xl bg-secondary/30 border border-secondary hover:border-primary/30 hover:bg-white hover:shadow-md transition-all duration-200 text-center gap-3 group"
                >
                  <div className="p-2 bg-white rounded-full text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <ex.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    "{ex.text}"
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
