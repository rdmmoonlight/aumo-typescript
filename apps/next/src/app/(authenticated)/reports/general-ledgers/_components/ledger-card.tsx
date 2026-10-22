import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber } from "../_lib/format";
import { LedgerAccount } from "../_lib/types";
import { LedgerTable } from "./ledger-table";

export function LedgerCard({ ledger }: { ledger: LedgerAccount }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30 border-b flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-amber-500 text-xs">
            {ledger.referenceNumber}
          </Badge>
          <span className="font-semibold text-sm">{ledger.accountName}</span>
          <Badge variant="secondary" className="text-xs">
            {ledger.type}
          </Badge>
        </div>
        <span className="font-mono text-xs font-semibold text-emerald-500">
          Ending: {formatNumber(ledger.endingBalance)}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <LedgerTable lines={ledger.lines} />
      </CardContent>
    </Card>
  );
}
