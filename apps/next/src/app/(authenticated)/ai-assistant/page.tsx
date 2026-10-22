"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Bot,
  Zap,
  Banknote,
  TrendingUp,
  PieChart,
  Lightbulb,
  Trash2,
  Send,
  Sparkles,
  LucideIcon,
  MessageSquare,
} from "lucide-react";

interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  timestamp: string;
}

interface PresetQuestion {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  prompt: string;
  color: string;
}

function formatBold(text: string) {
  return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

const chatColumnHelper = createColumnHelper<ChatMessage>();
const presetColumnHelper = createColumnHelper<PresetQuestion>();

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoaded, setSummaryLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSummaryText(
        "Likuiditas dan posisi kas Anda dalam kondisi sangat stabil dengan surplus positif untuk periode ini. Beban operasional masih berada di bawah ambang batas risiko.",
      );
      setSummaryLoaded(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText ?? userInput;
    const message = textToSend.trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      isUser: true,
      text: message,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setUserInput("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 1000));

    let aiReply = "";
    const low = message.toLowerCase();
    if (
      low.includes("cash") ||
      low.includes("kas") ||
      low.includes("liquidity")
    ) {
      aiReply =
        "**Analisis Likuiditas:** Total setara kas saat ini adalah **Rp 45.500.000**. Rasio cakupan sangat baik untuk 3 bulan ke depan.";
    } else if (
      low.includes("overspending") ||
      low.includes("expense") ||
      low.includes("beban")
    ) {
      aiReply =
        "**Peringatan Pengeluaran:** Pengeluaran terbesar berada pada **Gaji & Sewa Kantor**. Belum terdeteksi adanya anomali.";
    } else if (
      low.includes("net income") ||
      low.includes("revenue") ||
      low.includes("profit") ||
      low.includes("laba")
    ) {
      aiReply =
        "**Proyeksi Pendapatan:** Pendapatan kotor sebesar **Rp 85.000.000** dengan perkiraan laba bersih **Rp 32.400.000**.";
    } else {
      aiReply =
        "Berdasarkan data periode aktif, stabilitas keuangan konsisten. Apakah Anda ingin audit mendalam pada jurnal penyesuaian?";
    }

    const aiMsg: ChatMessage = {
      id: `${Date.now()}-ai`,
      isUser: false,
      text: aiReply,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const presets = useMemo<PresetQuestion[]>(
    () => [
      {
        id: "1",
        icon: Banknote,
        title: "Kesehatan Kas",
        desc: "Cek keamanan kas liquid",
        prompt: "Bagaimana posisi kas dan likuiditas saya saat ini?",
        color: "text-blue-500 bg-blue-500/10",
      },
      {
        id: "2",
        icon: TrendingUp,
        title: "Deteksi Pengeluaran",
        desc: "Cek beban tertinggi",
        prompt: "Apakah ada area pengeluaran berlebih yang perlu direview?",
        color: "text-red-500 bg-red-500/10",
      },
      {
        id: "3",
        icon: PieChart,
        title: "Proyeksi Laba",
        desc: "Estimasi laba bersih",
        prompt: "Berapa estimasi laba bersih dan tren pendapatan periode ini?",
        color: "text-emerald-500 bg-emerald-500/10",
      },
      {
        id: "4",
        icon: Lightbulb,
        title: "Tips Efisiensi",
        desc: "Saran penghematan",
        prompt:
          "Berikan 3 langkah konkret untuk mengoptimalkan kinerja keuangan.",
        color: "text-amber-500 bg-amber-500/10",
      },
    ],
    [],
  );

  // TanStack Table Column Definitions untuk Presets
  const presetColumns = useMemo(
    () => [
      presetColumnHelper.accessor("title", {
        header: "Topik Rekomendasi",
        cell: ({ row }) => {
          const IconComponent = row.original.icon;
          return (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-md grid place-items-center shrink-0",
                  row.original.color,
                )}
              >
                <IconComponent size={15} />
              </div>
              <span className="font-semibold text-caption">
                {row.original.title}
              </span>
            </div>
          );
        },
      }),
      presetColumnHelper.accessor("desc", {
        header: "Deskripsi Sintesis",
        cell: ({ row }) => (
          <span className="text-caption text-muted-foreground">
            {row.original.desc}
          </span>
        ),
      }),
      presetColumnHelper.display({
        id: "action",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-caption gap-1"
              onClick={() => handleSendMessage(row.original.prompt)}
              disabled={isLoading}
            >
              <Send size={12} /> Tanya
            </Button>
          </div>
        ),
      }),
    ],
    [isLoading],
  );

  const presetTable = useReactTable({
    data: presets,
    columns: presetColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  // TanStack Table Column Definitions untuk Chat Log
  const chatColumns = useMemo(
    () => [
      chatColumnHelper.accessor("isUser", {
        header: "Pengirim",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 w-[100px]">
            {row.original.isUser ? (
              <Badge variant="outline" className="text-label-small py-0 px-1.5">
                Pengguna
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="text-label-small py-0 px-1.5 bg-primary/20 text-primary hover:bg-primary/20 border-primary/30"
              >
                AI System
              </Badge>
            )}
          </div>
        ),
      }),
      chatColumnHelper.accessor("text", {
        header: "Isi Pesan",
        cell: ({ row }) => (
          <div
            className={cn(
              "text-caption leading-relaxed py-1",
              row.original.isUser
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {formatBold(row.original.text)}
          </div>
        ),
      }),
      chatColumnHelper.accessor("timestamp", {
        header: () => <div className="text-right">Waktu</div>,
        cell: ({ row }) => (
          <div className="text-right text-label-small text-muted-foreground font-mono">
            {row.original.timestamp}
          </div>
        ),
      }),
    ],
    [],
  );

  const chatTable = useReactTable({
    data: messages,
    columns: chatColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-h2 font-bold tracking-tight flex items-center gap-2">
          <Bot size={26} className="text-primary" /> AI Financial Assistant
        </h1>
        <p className="text-ui text-muted-foreground mt-1">
          Analisis bisnis, deteksi pengeluaran, dan saran keuangan instan.
        </p>
      </div>

      {/* LIVE SUMMARY */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 text-primary text-label-small"
            >
              <Zap size={12} /> RINGKASAN LANGSUNG
            </Badge>
            {summaryLoaded && (
              <span className="text-caption text-muted-foreground">
                Diperbarui baru saja
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!summaryLoaded ? (
            <div className="flex items-center gap-2 text-ui text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Menganalisis arus kas & transaksi aktif Anda...
            </div>
          ) : (
            <p className="text-ui leading-relaxed">{summaryText}</p>
          )}
        </CardContent>
      </Card>

      {/* PRESETS TABLE */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-ui flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" /> Rekomendasi
            Pertanyaan Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {presetTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-caption h-9">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {presetTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CHAT LOG TABLE CONTAINER */}
      <Card className="flex flex-col h-[500px]">
        <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b">
          <CardTitle className="text-ui flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Log Percakapan
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-caption gap-1"
            onClick={() => setMessages([])}
          >
            <Trash2 size={14} /> Bersihkan
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Bot size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-ui">
                Klik tombol "Tanya" pada tabel rekomendasi di atas atau ketik
                pertanyaan di bawah.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {chatTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-caption h-8">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {chatTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {isLoading && (
            <div className="p-4 flex items-center gap-2 text-caption text-muted-foreground border-t">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              AI sedang menganalisis data...
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t flex gap-2">
          <Input
            placeholder="Tanyakan sesuatu atau minta analisis khusus..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
            className="h-10 text-caption"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading}
            className="h-10 px-4 gap-1.5 text-caption"
          >
            <Send size={16} /> Kirim
          </Button>
        </div>
      </Card>
    </div>
  );
}
