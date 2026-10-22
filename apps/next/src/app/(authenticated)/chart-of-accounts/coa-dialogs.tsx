"use client";

import {
  ACCOUNT_RANGES,
  ACCOUNT_TYPES,
  ChartOfAccount,
} from "@/app/(authenticated)/chart-of-accounts/coa-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  addAccountSchema,
  editAccountSchema,
} from "@/lib/validations/chart-of-accounts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type AddSchemaType = ReturnType<typeof addAccountSchema>;
type EditSchemaType = typeof editAccountSchema;

// ==========================================
// ADD ACCOUNT DIALOG
// ==========================================
export function AddAccountDialog({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ChartOfAccount[];
  onSuccess: (msg: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const schema = useMemo(() => addAccountSchema(accounts), [accounts]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.input<AddSchemaType>, any, z.output<AddSchemaType>>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "",
      referenceNumber: 0,
      accountName: "",
      role: "Default",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (values: z.output<AddSchemaType>) => {
    setApiError(null);
    setIsCreating(true);

    try {
      // Direct call ke endpoint RTK Query tanpa hook
      const result = await store.dispatch(
        chartOfAccountsApi.endpoints.createChartOfAccount.initiate({
          referenceNumber: Number(values.referenceNumber),
          accountName: values.accountName,
          type: values.type,
          role: values.role ?? "Default",
        }),
      );

      if ("error" in result) {
        const err = result.error as any;
        throw new Error(
          err?.data?.message || err?.message || "Failed to create account",
        );
      }

      onSuccess(`Account '${values.accountName}' created`);
      onOpenChange(false);
      reset();
    } catch (err: any) {
      setApiError(err?.message || "Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Plus size={18} className="text-primary" /> Add New Account
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => {
                setValue("type", v, { shouldValidate: true });
                const startRef = ACCOUNT_RANGES[v]?.start || 0;
                setValue("referenceNumber", startRef, { shouldValidate: true });
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCOUNT_RANGES[t]?.label ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-500 font-medium">
                {errors.type.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Reference Number</Label>
            <Input
              type="number"
              {...register("referenceNumber", { valueAsNumber: true })}
              disabled={!selectedType}
              className="text-sm"
            />
            {errors.referenceNumber ? (
              <p className="text-xs text-red-500 font-medium">
                {errors.referenceNumber.message as string}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {selectedType
                  ? `Valid: ${ACCOUNT_RANGES[selectedType]?.start}-${ACCOUNT_RANGES[selectedType]?.end}`
                  : "Select category first"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Account Name</Label>
            <Input {...register("accountName")} className="text-sm" />
            {errors.accountName && (
              <p className="text-xs text-red-500 font-medium">
                {errors.accountName.message as string}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="text-sm font-medium"
            >
              {isCreating ? "Saving..." : "Save Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// EDIT ACCOUNT DIALOG
// ==========================================
export function EditAccountDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: ChartOfAccount;
  onSuccess: (msg: string) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<EditSchemaType>, any, z.output<EditSchemaType>>({
    resolver: zodResolver(editAccountSchema),
    defaultValues: {
      id: Number(account.id),
      accountName: account.accountName,
      referenceNumber: Number(account.referenceNumber),
      type: account.type,
      role: account.role ?? "Default",
      isActive: account.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      id: Number(account.id),
      accountName: account.accountName,
      referenceNumber: Number(account.referenceNumber),
      type: account.type,
      role: account.role ?? "Default",
      isActive: account.isActive ?? true,
    });
  }, [account, reset]);

  const onSubmit = async (values: z.output<EditSchemaType>) => {
    setApiError(null);
    setIsUpdating(true);

    try {
      // Direct call ke endpoint RTK Query tanpa hook
      const result = await store.dispatch(
        chartOfAccountsApi.endpoints.updateChartOfAccount.initiate({
          id: values.id,
          updateAccountRequest: {
            referenceNumber: Number(values.referenceNumber),
            accountName: values.accountName,
            type: values.type,
            role: values.role ?? "Default",
            isActive: values.isActive ?? true,
          },
        }),
      );

      if ("error" in result) {
        const err = result.error as any;
        throw new Error(
          err?.data?.message || err?.message || "Failed to update account",
        );
      }

      onSuccess(`Account '${values.accountName}' updated`);
      onOpenChange(false);
    } catch (err: any) {
      setApiError(err?.message || "Failed to update account");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label className="text-sm">Name</Label>
            <Input {...register("accountName")} className="text-sm" />
            {errors.accountName && (
              <p className="text-xs text-red-500 font-medium">
                {errors.accountName.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Ref Number</Label>
            <Input
              type="number"
              {...register("referenceNumber", { valueAsNumber: true })}
              className="text-sm"
            />
            {errors.referenceNumber && (
              <p className="text-xs text-red-500 font-medium">
                {errors.referenceNumber.message as string}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="text-sm font-medium"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// DELETE ACCOUNT ALERT DIALOG
// ==========================================
export function DeleteAccountAlertDialog({
  account,
  onOpenChange,
  onSuccess,
  onError,
}: {
  account: ChartOfAccount | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!account) return;
    setIsDeleting(true);

    try {
      // Direct call ke endpoint RTK Query tanpa hook
      const result = await store.dispatch(
        chartOfAccountsApi.endpoints.deleteChartOfAccount.initiate({
          id: Number(account.id),
        }),
      );

      if ("error" in result) {
        const err = result.error as any;
        throw new Error(
          err?.data?.message || err?.message || "Failed to delete account",
        );
      }

      onSuccess(`Deleted '${account.accountName}'`);
      onOpenChange(false);
    } catch (err: any) {
      onError(err?.message || "Failed to delete account");
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!account} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Are you sure you want to delete &quot;{account?.accountName}&quot;?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="text-sm">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
