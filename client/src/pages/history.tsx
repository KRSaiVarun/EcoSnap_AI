import { useDecisions } from "@/hooks/use-decisions";
import { Header } from "@/components/layout/header";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { DecisionResultCard } from "@/components/decision-result-card";

export default function HistoryPage() {
  const { data: decisions, isLoading, isError } = useDecisions();

  return (
    <div className="min-h-screen bg-background font-sans pt-20 pb-12">
      <Header />

      <main className="container max-w-3xl mx-auto px-4 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Decision History</h1>
            <p className="text-muted-foreground mt-1">Track your journey towards a greener lifestyle.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-destructive">
            Failed to load history. Please try again later.
          </div>
        ) : !decisions || decisions.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
            <p className="text-muted-foreground text-lg">No decisions recorded yet.</p>
            <Link href="/" className="inline-block mt-4 text-primary font-medium hover:underline">
              Make your first decision
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {decisions.map((decision, index) => (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-l-0 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    {decision.category}
                  </div>
                  <DecisionResultCard decision={decision} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
