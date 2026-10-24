// <copyright file="WorksheetDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.DTOs.Reports;

using Accounting.Api.Controllers.Reports;
using Accounting.Api.DTOs;
using Accounting.Api.DTOs.Reports;
using Accounting.Api.Helpers;
using Accounting.Api.Models;


/// <summary>
/// Model data Worksheet Row Api Response.
/// </summary>

public class WorksheetRowApiResponse
{
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>
    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>

    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Normal Balance Is Debit.
    /// </summary>

    public bool NormalBalanceIsDebit { get; set; }
    /// <summary>
    /// Mewakili Unadjusted Debit.
    /// </summary>

    public decimal UnadjustedDebit { get; set; }
    /// <summary>
    /// Mewakili Unadjusted Credit.
    /// </summary>

    public decimal UnadjustedCredit { get; set; }
    /// <summary>
    /// Mewakili Adjustment Debit.
    /// </summary>

    public decimal AdjustmentDebit { get; set; }
    /// <summary>
    /// Mewakili Adjustment Credit.
    /// </summary>

    public decimal AdjustmentCredit { get; set; }
    /// <summary>
    /// Mewakili Adjusting Debit.
    /// </summary>

    public decimal AdjustingDebit { get; set; }
    /// <summary>
    /// Mewakili Adjusting Credit.
    /// </summary>

    public decimal AdjustingCredit { get; set; }
    /// <summary>
    /// Mewakili Adjusted Debit.
    /// </summary>

    public decimal AdjustedDebit { get; set; }
    /// <summary>
    /// Mewakili Adjusted Credit.
    /// </summary>

    public decimal AdjustedCredit { get; set; }
    /// <summary>
    /// Mewakili Income Statement Debit.
    /// </summary>

    public decimal IncomeStatementDebit { get; set; }
    /// <summary>
    /// Mewakili Income Statement Credit.
    /// </summary>

    public decimal IncomeStatementCredit { get; set; }
    /// <summary>
    /// Mewakili Balance Sheet Debit.
    /// </summary>

    public decimal BalanceSheetDebit { get; set; }
    /// <summary>
    /// Mewakili Balance Sheet Credit.
    /// </summary>

    public decimal BalanceSheetCredit { get; set; }
    /// <summary>
    /// Mewakili Financial Position Debit.
    /// </summary>

    public decimal FinancialPositionDebit { get; set; }
    /// <summary>
    /// Mewakili Financial Position Credit.
    /// </summary>

    public decimal FinancialPositionCredit { get; set; }
}
