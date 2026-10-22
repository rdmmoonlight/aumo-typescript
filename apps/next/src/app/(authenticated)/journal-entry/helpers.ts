import { createColumnHelper } from "@tanstack/react-table";

export interface LineItem {
  id: string;
  accountId: number;
  lineDescription: string;
  debit: string;
  credit: string;
}

export type AccountOption = {
  id: number;
  referenceNumber: number | string;
  accountName: string;
  [key: string]: any;
};

export const formatIDR = (amount: number) =>
  new Intl.NumberFormat("id-ID").format(amount);

export const formatNumberWithDots = (val: string | number): string => {
  if (!val) return "";
  const clean = val.toString().replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
};

export const columnHelper = createColumnHelper<LineItem>();
