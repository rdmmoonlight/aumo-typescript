"use client";
import type {
  AccountBalanceItem,
  TrendItem,
} from "@/app/(authenticated)/dashboard/dashboard-tables";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { PieChart, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { boxWidth: 10, usePointStyle: true, padding: 16 },
    },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: "hsl(var(--border))" } },
    x: { grid: { display: false } },
  },
};
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { boxWidth: 10, usePointStyle: true },
    },
  },
};

export function DashboardCharts({
  chartTrend,
  expenseAccountsList,
  totalCashOnHand,
  totalBankBalance,
  periodType,
}: {
  chartTrend: TrendItem[];
  expenseAccountsList: AccountBalanceItem[];
  totalCashOnHand: number;
  totalBankBalance: number;
  periodType: "monthly" | "annual";
}) {
  const barTrendData = useMemo(
    () => ({
      labels: chartTrend?.map((t) => t.label) || [],
      datasets: [
        {
          label: "Revenue",
          data: chartTrend?.map((t) => t.revenue) || [],
          backgroundColor: "#10b981",
          borderRadius: 4,
        },
        {
          label: "Expenses",
          data: chartTrend?.map((t) => t.expense) || [],
          backgroundColor: "#ef4444",
          borderRadius: 4,
        },
      ],
    }),
    [chartTrend],
  );

  const lineNetData = useMemo(
    () => ({
      labels: chartTrend?.map((t) => t.label) || [],
      datasets: [
        {
          label: "Net Income",
          data: chartTrend?.map((t) => t.net) || [],
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    }),
    [chartTrend],
  );

  const doughnutCashData = useMemo(
    () => ({
      labels: ["Cash on Hand", "Bank Balance"],
      datasets: [
        {
          data: [totalCashOnHand, totalBankBalance],
          backgroundColor: ["#6366f1", "#06b6d4"],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    }),
    [totalCashOnHand, totalBankBalance],
  );

  const expenseChartData = useMemo(
    () => ({
      labels: expenseAccountsList?.length
        ? expenseAccountsList.map((i) => i.accountName)
        : ["No Expenses"],
      datasets: [
        {
          data: expenseAccountsList?.length
            ? expenseAccountsList.map((i) => i.balance)
            : [1],
          backgroundColor: [
            "#ef4444",
            "#f59e0b",
            "#f97316",
            "#8b5cf6",
            "#6b7280",
            "#10b981",
            "#ec4899",
          ],
          borderWidth: 0,
        },
      ],
    }),
    [expenseAccountsList],
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-ui">
                Revenue vs Expense Trend
              </CardTitle>
              <CardDescription className="text-caption">
                {periodType === "annual" ? "Jan - Dec" : "Daily in period"}
              </CardDescription>
            </div>
            <PieChart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-64">
            <Bar data={barTrendData} options={chartOptions as any} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-ui">Net Income Trend</CardTitle>
              <CardDescription className="text-caption">
                Profitability over time
              </CardDescription>
            </div>
            <TrendingUp size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-64">
            <Line data={lineNetData} options={chartOptions as any} />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-ui">Asset Composition</CardTitle>
              <CardDescription className="text-caption">
                Cash vs Bank
              </CardDescription>
            </div>
            <PieChart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-64 flex justify-center">
            <Doughnut
              data={doughnutCashData}
              options={doughnutOptions as any}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-ui">Expense Composition</CardTitle>
              <CardDescription className="text-caption">
                Operating Breakdown
              </CardDescription>
            </div>
            <PieChart size={18} className="text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-64 flex justify-center">
            <Doughnut
              data={expenseChartData}
              options={doughnutOptions as any}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
