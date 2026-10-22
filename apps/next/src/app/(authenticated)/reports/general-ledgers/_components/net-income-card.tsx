// net-income-card.tsx (khusus temporary)
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatNumber } from "../_lib/format";
export function NetIncomeCard({ netIncome }: { netIncome: number }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Net Income (Before Closing)
        </span>
        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          {netIncome >= 0 ? (
            <TrendingUp className="text-emerald-500" size={20} />
          ) : (
            <TrendingDown className="text-red-500" size={20} />
          )}
          <span
            className={netIncome >= 0 ? "text-emerald-600" : "text-red-600"}
          >
            IDR {formatNumber(netIncome)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
