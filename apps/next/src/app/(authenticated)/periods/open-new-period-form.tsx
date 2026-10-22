"use client";

import {
  MONTH_NAMES,
  type AccountItem,
  type CreatePeriodFormProps,
} from "@/app/(authenticated)/periods/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPeriodSchema,
  type CreatePeriodFormValues,
  type CreatePeriodOutputValues,
} from "@/lib/validations/period";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarPlus,
  Loader2,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";

export function CreatePeriodForm({
  openInfo,
  isLoadingOpenInfo,
  isCreating,
  isLoading,
  initialValues,
  defaultValues,
  onSubmit,
  onCancel,
}: CreatePeriodFormProps) {
  const mergedDefaultValues: Partial<CreatePeriodFormValues> = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    setupMode: openInfo?.hasExistingPermanentAccounts
      ? "LoadExisting"
      : "CreateNew",
    cashAccountId: "",
    bankAccountId: "",
    retainedId: "",
    cashAccountCode: "",
    cashAccountName: "",
    cashBalance: "",
    bankAccountCode: "",
    bankAccountName: "",
    bankBalance: "",
    retainedCode: "",
    retainedName: "",
    ...defaultValues,
    ...initialValues,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePeriodFormValues, any, CreatePeriodOutputValues>({
    resolver: zodResolver(createPeriodSchema),
    defaultValues: mergedDefaultValues,
  });

  const setupMode = watch("setupMode");
  const month = watch("month");
  const cashAccountId = watch("cashAccountId");
  const bankAccountId = watch("bankAccountId");
  const retainedId = watch("retainedId");

  const submitting = isCreating || isLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <CalendarPlus className="text-white" size={22} /> Open New Period
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Start monthly cycle. Opening balance posted on day 1.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-transparent border-white/10 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
          onClick={onCancel}
        >
          <ArrowLeft size={14} /> Back
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-[#151519] border-white/[0.07]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">
              Period
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-300">Month</Label>
              <Select
                value={
                  month !== undefined && month !== null ? String(month) : ""
                }
                onValueChange={(v) => setValue("month", Number(v))}
              >
                <SelectTrigger className="bg-[#0e0e10] border-white/10 text-white text-sm">
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e22] border-white/10 text-white text-sm">
                  {MONTH_NAMES.map((n, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && (
                <p className="text-xs text-red-500">{errors.month.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-300">Year</Label>
              <Input
                type="number"
                {...register("year", { valueAsNumber: true })}
                className="bg-[#0e0e10] border-white/10 text-white text-sm"
              />
              {errors.year && (
                <p className="text-xs text-red-500">{errors.year.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#151519] border-white/[0.07]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">
              Permanent Accounts Setup
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Choose existing or create new
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingOpenInfo ? (
              <div className="text-center py-4 text-xs text-zinc-500">
                <Loader2 className="animate-spin inline mr-1" size={14} />{" "}
                Memuat informasi akun...
              </div>
            ) : (
              <>
                <RadioGroup
                  value={setupMode}
                  onValueChange={(v: "LoadExisting" | "CreateNew") =>
                    setValue("setupMode", v)
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="LoadExisting"
                      id="load"
                      disabled={!openInfo?.hasExistingPermanentAccounts}
                      className="border-white/20 text-white"
                    />
                    <Label
                      htmlFor="load"
                      className="flex items-center gap-1 text-xs cursor-pointer text-zinc-300"
                    >
                      <RefreshCw size={12} /> Use Existing
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="CreateNew"
                      id="create"
                      className="border-white/20 text-white"
                    />
                    <Label
                      htmlFor="create"
                      className="flex items-center gap-1 text-xs cursor-pointer text-zinc-300"
                    >
                      <PlusCircle size={12} /> Register New
                    </Label>
                  </div>
                </RadioGroup>

                {setupMode === "LoadExisting" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-zinc-300">
                        Cash Account
                      </Label>
                      <Select
                        value={cashAccountId || ""}
                        onValueChange={(v) => setValue("cashAccountId", v)}
                      >
                        <SelectTrigger className="bg-[#0e0e10] border-white/10 text-white text-sm">
                          <SelectValue placeholder="Pilih Akun Kas" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1e22] border-white/10 text-white text-sm">
                          {openInfo?.availableCashAndBankAccounts?.map(
                            (a: AccountItem) => (
                              <SelectItem
                                key={a.id}
                                value={a.id?.toString() || ""}
                              >
                                {a.displayLabel ||
                                  `${a.referenceNumber} - ${a.accountName}`}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {errors.cashAccountId && (
                        <p className="text-xs text-red-500">
                          {errors.cashAccountId.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-zinc-300">
                        Bank Account
                      </Label>
                      <Select
                        value={bankAccountId || ""}
                        onValueChange={(v) => setValue("bankAccountId", v)}
                      >
                        <SelectTrigger className="bg-[#0e0e10] border-white/10 text-white text-sm">
                          <SelectValue placeholder="Pilih Akun Bank" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1e22] border-white/10 text-white text-sm">
                          {openInfo?.availableCashAndBankAccounts?.map(
                            (a: AccountItem) => (
                              <SelectItem
                                key={a.id}
                                value={a.id?.toString() || ""}
                              >
                                {a.displayLabel ||
                                  `${a.referenceNumber} - ${a.accountName}`}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {errors.bankAccountId && (
                        <p className="text-xs text-red-500">
                          {errors.bankAccountId.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-zinc-300">
                        Retained Earnings
                      </Label>
                      <Select
                        value={retainedId || ""}
                        onValueChange={(v) => setValue("retainedId", v)}
                      >
                        <SelectTrigger className="bg-[#0e0e10] border-white/10 text-white text-sm">
                          <SelectValue placeholder="Pilih Retained Earnings" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1e22] border-white/10 text-white text-sm">
                          {openInfo?.availableRetainedEarningsAccounts?.map(
                            (a: AccountItem) => (
                              <SelectItem
                                key={a.id}
                                value={a.id?.toString() || ""}
                              >
                                {a.displayLabel ||
                                  `${a.referenceNumber} - ${a.accountName}`}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      {errors.retainedId && (
                        <p className="text-xs text-red-500">
                          {errors.retainedId.message}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Cash Code
                        </Label>
                        <Input
                          {...register("cashAccountCode")}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                        {errors.cashAccountCode && (
                          <p className="text-xs text-red-500">
                            {errors.cashAccountCode.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Cash Name
                        </Label>
                        <Input
                          {...register("cashAccountName")}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                        {errors.cashAccountName && (
                          <p className="text-xs text-red-500">
                            {errors.cashAccountName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Cash Balance
                        </Label>
                        <Input
                          type="number"
                          {...register("cashBalance", {
                            setValueAs: (v) => (v === "" ? "" : Number(v)),
                          })}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Bank Code
                        </Label>
                        <Input
                          {...register("bankAccountCode")}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                        {errors.bankAccountCode && (
                          <p className="text-xs text-red-500">
                            {errors.bankAccountCode.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Bank Name
                        </Label>
                        <Input
                          {...register("bankAccountName")}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                        {errors.bankAccountName && (
                          <p className="text-xs text-red-500">
                            {errors.bankAccountName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Bank Balance
                        </Label>
                        <Input
                          type="number"
                          {...register("bankBalance", {
                            setValueAs: (v) => (v === "" ? "" : Number(v)),
                          })}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Retained Code
                        </Label>
                        <Input
                          {...register("retainedCode")}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                        {errors.retainedCode && (
                          <p className="text-xs text-red-500">
                            {errors.retainedCode.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">
                          Retained Name
                        </Label>
                        <Input
                          {...register("retainedName")}
                          className="bg-[#0e0e10] border-white/10 text-white text-sm"
                        />
                        {errors.retainedName && (
                          <p className="text-xs text-red-500">
                            {errors.retainedName.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-transparent border-white/10 text-sm text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-white text-black text-sm font-medium hover:bg-zinc-200"
          >
            {submitting ? "Creating..." : "Submit Period"}
          </Button>
        </div>
      </form>
    </div>
  );
}
