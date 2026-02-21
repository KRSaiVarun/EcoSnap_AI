import { Leaf } from "lucide-react";
import { motion } from "framer-motion";

interface SustainabilityScoreProps {
  score: number;
}

export function SustainabilityScore({ score }: SustainabilityScoreProps) {
  // Score mapping: 10 (Excellent), 7 (Good), 5 (Average), 3 (Poor)
  
  const getScoreColor = (s: number) => {
    if (s >= 10) return "text-green-600 bg-green-100 border-green-200";
    if (s >= 7) return "text-emerald-600 bg-emerald-100 border-emerald-200";
    if (s >= 5) return "text-yellow-600 bg-yellow-100 border-yellow-200";
    return "text-orange-600 bg-orange-100 border-orange-200";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 10) return "Excellent Choice";
    if (s >= 7) return "Good Impact";
    if (s >= 5) return "Moderate Impact";
    return "Low Impact";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        relative flex items-center justify-center w-16 h-16 rounded-full border-4
        ${getScoreColor(score)}
      `}>
        <span className="text-2xl font-bold font-display">{score}</span>
        <motion.div 
          className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Leaf className="w-4 h-4 text-primary fill-primary" />
        </motion.div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {getScoreLabel(score)}
      </span>
    </div>
  );
}
