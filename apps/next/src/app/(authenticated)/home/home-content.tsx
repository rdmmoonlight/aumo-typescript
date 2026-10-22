"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppDispatch, RootState } from "@/lib/store";
import { homeApi } from "@/lib/store/(authenticated)/home/homeApi";
import {
  Clock,
  LayoutDashboard,
  LineChart,
  Notebook,
  RotateCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";

interface MarketItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
}

export default function HomeContent() {
  const dispatch = useDispatch<AppDispatch>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const rawResponse = useSelector(
    (state: RootState) =>
      homeApi.endpoints.getMarketIndicators.select()(state)?.data,
  );

  const fetchMarketData = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await dispatch(
        homeApi.endpoints.getMarketIndicators.initiate(undefined, {
          subscribe: false,
          forceRefetch: true,
        }),
      );

      if ("error" in result) {
        setIsError(true);
      } else {
        setIsError(false);
        setLastUpdated(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const extractRawItems = (res: unknown): Record<string, unknown>[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (typeof res === "object") {
      const obj = res as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.result)) return obj.result;
      if (Array.isArray(obj.rates)) return obj.rates;
      return [obj];
    }
    return [];
  };

  const rawList = extractRawItems(rawResponse);
  const marketData: MarketItem[] = rawList.map((item) => {
    const symbol = String(
      item.symbol ?? item.Symbol ?? item.code ?? item.currency ?? "N/A",
    );
    const name = String(
      item.name ?? item.Name ?? item.description ?? item.pair ?? "",
    );
    const rawPrice = item.price ?? item.Price ?? item.value ?? item.rate ?? 0;
    const rawChange = item.change ?? item.Change ?? item.changePercent ?? 0;
    const isUp = Boolean(item.isUp ?? item.IsUp ?? Number(rawChange) >= 0);

    const numericPrice = Number(rawPrice);
    const isCurrency = symbol.includes("/IDR");
    const formattedPrice = Number.isFinite(numericPrice)
      ? isCurrency
        ? `Rp ${Math.round(numericPrice).toLocaleString("id-ID")}`
        : numericPrice.toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      : String(rawPrice);

    const numericChange = Number(rawChange);
    const formattedChange = Number.isFinite(numericChange)
      ? `${numericChange >= 0 ? "+" : ""}${numericChange.toFixed(2)}%`
      : String(rawChange);

    return {
      symbol,
      name,
      price: formattedPrice,
      change: formattedChange,
      isUp,
    };
  });

  return (
    <div className="grid w-full place-items-center py-6">
      <Card className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0F172A] p-6 text-white shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-amber-400">
                <LineChart size={18} /> Market Indicators
              </h3>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/10 text-[11px] text-emerald-400"
                >
                  LIVE
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchMarketData}
                  disabled={isFetching}
                  className="h-7 w-7 rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                  title="Refresh Indikator Pasar"
                >
                  <RotateCw
                    size={14}
                    className={isFetching ? "animate-spin text-amber-400" : ""}
                  />
                </Button>
              </div>
            </div>

            {lastUpdated && (
              <div className="mb-3 flex items-center justify-end gap-1.5 text-[11px] text-white/50">
                <Clock size={12} />
                <span>Diperbarui: {lastUpdated} WIB</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {isLoading ? (
                <div className="col-span-2 py-4 text-center text-xs text-white/40">
                  Memuat indikator pasar...
                </div>
              ) : isError ? (
                <div className="col-span-2 py-4 text-center text-xs text-rose-400">
                  Gagal memuat indikator pasar dari server.
                </div>
              ) : marketData.length > 0 ? (
                marketData.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex min-h-[80px] flex-col justify-between rounded-lg border border-white/10 bg-black/40 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {item.symbol}
                      </span>
                      <Badge
                        className={`flex items-center border-0 px-1.5 py-0.5 text-[11px] ${
                          item.isUp
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {item.isUp ? (
                          <TrendingUp size={12} className="mr-0.5" />
                        ) : (
                          <TrendingDown size={12} className="mr-0.5" />
                        )}
                        {item.change}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {item.price}
                    </div>
                    <div className="text-xs text-white/50">{item.name}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-4 text-center text-xs text-white/40">
                  Tidak ada data pasar tersedia.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="mx-auto max-w-md text-base leading-relaxed text-white/80">
              Integrated financial & accounting intelligence core. Manage
              full-cycle general ledgers, trial balances, and operational
              analytics with absolute precision.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/80 to-violet-600/80 text-sm text-white shadow-lg hover:from-indigo-500 hover:to-violet-600"
              >
                <Link href="/dashboard">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15"
              >
                <Link href="/journal-entry">
                  <Notebook size={16} /> Journal Entry
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
