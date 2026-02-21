import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface CarbonComparisonProps {
  originalCo2: number;
  ecoCo2: number;
  savedCo2: number;
  percentage: number;
}

export function CarbonComparison({ originalCo2, ecoCo2, savedCo2, percentage }: CarbonComparisonProps) {
  // Calculate relative widths for bars (max 100%)
  const maxVal = Math.max(originalCo2, ecoCo2, 0.1); // Avoid div by zero
  const originalWidth = (originalCo2 / maxVal) * 100;
  const ecoWidth = (ecoCo2 / maxVal) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Comparison Bars */}
      <div className="space-y-3">
        {/* Original */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Original Choice</span>
            <span className="font-mono">{originalCo2} kg CO₂</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-slate-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${originalWidth}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Eco Alternative */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm font-medium text-primary-foreground/90">
            <span className="text-primary">Eco Alternative</span>
            <span className="font-mono text-primary">{ecoCo2} kg CO₂</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${ecoWidth}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">CO₂ Saved</p>
          <p className="text-xl font-bold text-primary font-display mt-1">{savedCo2} kg</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Reduction</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowDown className="w-4 h-4 text-green-600" />
            <p className="text-xl font-bold text-green-700 font-display">{percentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
