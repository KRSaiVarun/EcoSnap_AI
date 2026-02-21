import { motion } from "framer-motion";
import { Leaf, ArrowRight } from "lucide-react";
import { type AnalyzeDecisionResponse } from "@shared/routes";
import { SustainabilityScore } from "@/components/ui/sustainability-score";
import { CarbonComparison } from "@/components/ui/carbon-comparison";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DecisionResultCardProps {
  decision: AnalyzeDecisionResponse;
}

export function DecisionResultCard({ decision }: DecisionResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-2 border-primary/10 shadow-lg shadow-primary/5 bg-white">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary animate-gradient" />
        
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-muted-foreground">Original Action</h3>
            <p className="text-xl font-semibold text-foreground">{decision.originalAction}</p>
          </div>
          <SustainabilityScore score={decision.sustainabilityScore} />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Action -> Alternative Flow */}
          <div className="relative p-5 rounded-2xl bg-secondary/30 border border-secondary">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-full shadow-sm">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-primary-foreground text-lg">Eco Suggestion</h4>
            </div>
            
            <p className="text-lg font-medium text-foreground/90 pl-11">
              {decision.ecoAlternative}
            </p>
            
            <p className="mt-4 text-sm text-muted-foreground italic pl-11 border-l-2 border-primary/20">
              "{decision.encouragementMessage}"
            </p>
          </div>

          {/* Carbon Data Visualization */}
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Carbon Impact Analysis</h4>
            <CarbonComparison 
              originalCo2={Number(decision.originalCo2Kg)}
              ecoCo2={Number(decision.ecoCo2Kg)}
              savedCo2={Number(decision.co2SavedKg)}
              percentage={Number(decision.percentageReduction)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
