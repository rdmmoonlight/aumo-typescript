"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export function BalanceAlert({
  isBalanced,
  balancedText,
  unbalancedText,
}: {
  isBalanced: boolean;
  balancedText: string;
  unbalancedText: string;
}) {
  return (
    <Alert
      className={
        isBalanced
          ? "border-emerald-500/20 bg-emerald-500/10 text-ui"
          : "border-red-500/20 bg-red-500/10 text-ui"
      }
    >
      <CheckCircle2 size={16} />
      <AlertDescription className="text-caption">
        {isBalanced ? balancedText : unbalancedText}
      </AlertDescription>
    </Alert>
  );
}
