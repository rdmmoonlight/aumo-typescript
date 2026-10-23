"use client";

import {
  AccountOption,
  LineItem,
  formatNumberWithDots,
} from "@/app/(authenticated)/journal-entry/helpers";
import { JournalLinesTable } from "@/app/(authenticated)/journal-entry/journal-lines-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store } from "@/lib/store";
import { chartOfAccountsApi } from "@/lib/store/(authenticated)/chart-of-accounts/chartOfAccountsApi";
import { journalEntryApi } from "@/lib/store/(authenticated)/journal-entry/journalEntryApi";
import {
  journalEntrySchema,
  parseFormattedNumber,
} from "@/lib/validations/journal-entry";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit,
  Loader2,
  Lock,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

export default function JournalEntryContent() {
  const router = useRouter();
  const navigate = useRouter();
  const searchParams = useSearchParams();
  const entryIdParam = searchParams.get("id");
  const isEdit = Boolean(entryIdParam);
  const entryId = entryIdParam ? parseInt(entryIdParam, 10) : 0;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Manual State untuk menggantikan React Hooks bawaan RTK Query
  const [isAccountsLoading, setIsAccountsLoading] = useState<boolean>(true);
  const [availableAccounts, setAvailableAccounts] = useState<AccountOption[]>(
    [],
  );

  const [isTxLoading, setIsTxLoading] = useState<boolean>(false);
  const [nextTxNumber, setNextTxNumber] = useState<string | null>(null);

  const [isEditLoading, setIsEditLoading] = useState<boolean>(isEdit);
  const [editData, setEditData] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<
    z.input<typeof journalEntrySchema>,
    any,
    z.output<typeof journalEntrySchema>
  >({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      journalType: "General",
      entryDate: new Date().toISOString().split("T")[0],
      lines: [
        { id: "1", accountId: 0, lineDescription: "", debit: "", credit: "" },
        { id: "2", accountId: 0, lineDescription: "", debit: "", credit: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const journalType = watch("journalType");
  const entryDate = watch("entryDate");
  const watchedLines = watch("lines");

  // 1. Fetch Chart of Accounts langsung via store.dispatch
  useEffect(() => {
    let isMounted = true;
    const fetchAccounts = async () => {
      setIsAccountsLoading(true);
      try {
        const result: any = await store.dispatch(
          chartOfAccountsApi.endpoints.getChartOfAccounts.initiate(),
        );
        if (isMounted && result.data) {
          let list: any[] = [];
          const res = result.data;
          if (Array.isArray(res.accounts)) list = res.accounts;
          else if (Array.isArray(res.data)) list = res.data;
          else if (Array.isArray(res)) list = res;

          const mapped = list.map((a: any) => ({
            ...a,
            id: Number(a.id || 0),
            referenceNumber: a.referenceNumber ?? "",
            accountName: a.accountName ?? "",
          }));
          setAvailableAccounts(mapped);
        }
      } catch (err) {
        console.error("Failed to load accounts:", err);
      } finally {
        if (isMounted) setIsAccountsLoading(false);
      }
    };

    fetchAccounts();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Next Transaction Number (Untuk mode Create)
  useEffect(() => {
    if (isEdit) return;
    let isMounted = true;
    const fetchNextNumber = async () => {
      setIsTxLoading(true);
      try {
        const result: any = await store.dispatch(
          journalEntryApi.endpoints.getNextTransactionNumber.initiate({
            journalType,
            entryDate,
          }),
        );
        if (isMounted && result.data) {
          const raw = result.data;
          const txNo =
            typeof raw === "string"
              ? raw
              : raw.transactionNumber ||
              raw.nextTransactionNumber ||
              raw.data ||
              "";
          setNextTxNumber(txNo);
        }
      } catch (err) {
        console.error("Failed to fetch next transaction number:", err);
      } finally {
        if (isMounted) setIsTxLoading(false);
      }
    };

    fetchNextNumber();
    return () => {
      isMounted = false;
    };
  }, [journalType, entryDate, isEdit]);

  // 3. Fetch Detail Journal Entry (Untuk mode Edit)
  useEffect(() => {
    if (!isEdit || isNaN(entryId)) return;
    let isMounted = true;
    const fetchJournalById = async () => {
      setIsEditLoading(true);
      try {
        const result: any = await store.dispatch(
          journalEntryApi.endpoints.getJournalEntryById.initiate({
            id: entryId,
          }),
        );
        if (isMounted && result.data) {
          const resData = result.data;
          setEditData(resData);
          const jData = resData.entry || resData.data || resData;
          if (jData && typeof jData === "object") {
            if (jData.journalType) setValue("journalType", jData.journalType);
            if (jData.entryDate)
              setValue("entryDate", jData.entryDate.split("T")[0]);
            if (Array.isArray(jData.lines) && jData.lines.length > 0) {
              setValue(
                "lines",
                jData.lines.map((l: any, i: number) => ({
                  id: l.id?.toString() || `${Date.now()}-${i}`,
                  accountId: Number(l.accountId || 0),
                  lineDescription: l.lineDescription || "",
                  debit: l.debit > 0 ? formatNumberWithDots(l.debit) : "",
                  credit: l.credit > 0 ? formatNumberWithDots(l.credit) : "",
                })),
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to load journal entry:", err);
      } finally {
        if (isMounted) setIsEditLoading(false);
      }
    };

    fetchJournalById();
    return () => {
      isMounted = false;
    };
  }, [isEdit, entryId, setValue]);

  const displayedTxNumber = useMemo(() => {
    if (isEdit)
      return (
        (editData?.entry || editData?.data || editData)?.transactionNumber ||
        "Loading..."
      );
    return nextTxNumber || "Loading...";
  }, [isEdit, editData, nextTxNumber]);

  const isLocked = Boolean(
    isEdit && (editData?.isLocked || editData?.entry?.isLocked),
  );
  const totalDebit = useMemo(
    () =>
      (watchedLines || []).reduce(
        (s, l) => s + parseFormattedNumber(l?.debit || ""),
        0,
      ),
    [watchedLines],
  );
  const totalCredit = useMemo(
    () =>
      (watchedLines || []).reduce(
        (s, l) => s + parseFormattedNumber(l?.credit || ""),
        0,
      ),
    [watchedLines],
  );
  const isBalanced = useMemo(
    () => totalDebit > 0 && totalDebit === totalCredit,
    [totalDebit, totalCredit],
  );

  const addLine = () =>
    append({
      id: `${Date.now()}-${Math.random()}`,
      accountId: 0,
      lineDescription: "",
      debit: "",
      credit: "",
    });
  const removeLine = (index: number) => {
    if (fields.length <= 2) {
      setApiError("Minimal 2 baris jurnal wajib ada.");
      return;
    }
    setApiError(null);
    remove(index);
  };
  const handleAmountChange = (
    index: number,
    field: "debit" | "credit",
    value: string,
  ) => {
    const formatted = formatNumberWithDots(value);
    setValue(`lines.${index}.${field}`, formatted, { shouldValidate: true });
    if (value !== "")
      setValue(`lines.${index}.${field === "debit" ? "credit" : "debit"}`, "", {
        shouldValidate: true,
      });
  };

  const resetForm = () => {
    reset({
      journalType: "General",
      entryDate: new Date().toISOString().split("T")[0],
      lines: [
        {
          id: `${Date.now()}-1`,
          accountId: 0,
          lineDescription: "",
          debit: "",
          credit: "",
        },
        {
          id: `${Date.now()}-2`,
          accountId: 0,
          lineDescription: "",
          debit: "",
          credit: "",
        },
      ],
    });
    setApiError(null);
    setSuccessMessage(null);
  };

  const onSubmit: SubmitHandler<z.output<typeof journalEntrySchema>> = async (
    data,
  ) => {
    setApiError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const effective = data.lines.filter(
      (l) =>
        Number(l.accountId) > 0 &&
        (parseFormattedNumber(l.debit || "") > 0 ||
          parseFormattedNumber(l.credit || "") > 0),
    );
    const payloadLines = effective.map((l) => ({
      accountId: Number(l.accountId),
      lineDescription: l.lineDescription || "",
      debit: parseFormattedNumber(l.debit || ""),
      credit: parseFormattedNumber(l.credit || ""),
    }));

    try {
      if (isEdit) {
        const result: any = await store.dispatch(
          journalEntryApi.endpoints.editJournalEntry.initiate({
            id: entryId,
            body: {
              entryDate: data.entryDate,
              journalType: data.journalType,
              transactionNumber: displayedTxNumber,
              lines: payloadLines,
            },
          }),
        );

        if ("data" in result) {
          const res = result.data;
          setSuccessMessage(
            `Updated ${res?.transactionNumber || displayedTxNumber}`,
          );
          setTimeout(() => router.push("/reports/general-journal"), 1200);
        } else if ("error" in result) {
          const err: any = result.error;
          setApiError(
            err?.data?.message ||
            err?.message ||
            "Failed to update journal entry",
          );
        }
      } else {
        const result: any = await store.dispatch(
          journalEntryApi.endpoints.createJournalEntry.initiate({
            journalType: data.journalType,
            entryDate: data.entryDate,
            lines: payloadLines,
          }),
        );

        if ("data" in result) {
          const res = result.data;
          setSuccessMessage(
            `Posted ${res?.transactionNumber || res?.data?.transactionNumber || displayedTxNumber}`,
          );
          resetForm();
        } else if ("error" in result) {
          const err: any = result.error;
          setApiError(
            err?.data?.message ||
            err?.message ||
            "Failed to post journal entry",
          );
        }
      }
    } catch (err: any) {
      setApiError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAccountsLoading || (isEdit && isEditLoading)) {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {isEdit ? (
              <Edit className="text-primary" />
            ) : (
              <BookOpen className="text-primary" />
            )}
            {isEdit ? "Edit Journal Entry" : "Create Journal Entry"}
            {isEdit && (
              <Badge variant="secondary" className="font-mono text-xs">
                {displayedTxNumber}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Record double-entry transactions
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="text-sm">
          <Link href="/reports/general-journal" className="gap-1.5">
            <ArrowLeft size={14} /> Back to Journal
          </Link>
        </Button>
      </div>

      {successMessage && (
        <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 size={16} />
          <AlertDescription className="text-xs">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {(errors.lines || apiError) && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription className="text-xs">
            <ul className="list-disc ml-4">
              {errors.lines?.root?.message && (
                <li>{errors.lines.root.message}</li>
              )}
              {apiError && <li>{apiError}</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isLocked ? (
        <Alert>
          <Lock size={16} />
          <AlertDescription className="text-xs">
            Journal {displayedTxNumber} is in closed period.{" "}
            <Link href="/reports/general-journal" className="underline">
              Back
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Transaction Info
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Transaction No.</span>
                  {isTxLoading && (
                    <Loader2
                      size={12}
                      className="animate-spin text-muted-foreground"
                    />
                  )}
                </Label>
                <Input
                  className="h-9 font-mono bg-muted text-sm"
                  value={displayedTxNumber}
                  readOnly
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Journal Type</Label>
                <Select
                  value={watch("journalType")}
                  onValueChange={(v) =>
                    setValue("journalType", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    <SelectItem value="General">
                      General Journal (GJ)
                    </SelectItem>
                    <SelectItem value="Adjusting">
                      Adjusting Entry (AJ)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.journalType && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.journalType.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  {...register("entryDate")}
                />
                {errors.entryDate && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.entryDate.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <JournalLinesTable
            fields={fields as LineItem[]}
            availableAccounts={availableAccounts}
            watchedLines={watchedLines}
            register={register}
            setValue={setValue}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            isBalanced={isBalanced}
            onAddLine={addLine}
            onRemoveLine={removeLine}
            onAmountChange={handleAmountChange}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="text-sm"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!isBalanced || isSubmitting}
              className="gap-2 text-sm font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {isEdit ? "Save Changes" : "Post Journal Entry"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
