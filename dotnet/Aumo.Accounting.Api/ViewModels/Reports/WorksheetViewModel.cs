// <copyright file="WorksheetViewModel.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.ViewModels.Reports;

using System.Collections.Generic;
using System.Linq;
using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;


/// <summary>
/// Mewakili Worksheet Row.
/// </summary>

public class WorksheetRow
{
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>
    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>

    public string? ReferenceNumber { get; set; }
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
    /// Mewakili Financial Position Debit.
    /// </summary>

    public decimal FinancialPositionDebit { get; set; }
    /// <summary>
    /// Mewakili Financial Position Credit.
    /// </summary>

    public decimal FinancialPositionCredit { get; set; }
}
/// <summary>
/// Model data Worksheet View Model.
/// </summary>

public class WorksheetViewModel
{
    /// <summary>
    /// Mewakili Rows.
    /// </summary>
    public List<WorksheetRow> Rows { get; set; } = new();
    /// <summary>
    /// Mewakili Net Income.
    /// </summary>

    public decimal NetIncome { get; set; }
    /// <summary>
    /// Mewakili Total Unadjusted Debit.
    /// </summary>

    public decimal TotalUnadjustedDebit => this.Rows.Sum(r => r.UnadjustedDebit);
    /// <summary>
    /// Mewakili Total Unadjusted Credit.
    /// </summary>

    public decimal TotalUnadjustedCredit => this.Rows.Sum(r => r.UnadjustedCredit);
    /// <summary>
    /// Mewakili Total Adjustment Debit.
    /// </summary>

    public decimal TotalAdjustmentDebit => this.Rows.Sum(r => r.AdjustmentDebit);
    /// <summary>
    /// Mewakili Total Adjustment Credit.
    /// </summary>

    public decimal TotalAdjustmentCredit => this.Rows.Sum(r => r.AdjustmentCredit);
    /// <summary>
    /// Mewakili Total Adjusted Debit.
    /// </summary>

    public decimal TotalAdjustedDebit => this.Rows.Sum(r => r.AdjustedDebit);
    /// <summary>
    /// Mewakili Total Adjusted Credit.
    /// </summary>

    public decimal TotalAdjustedCredit => this.Rows.Sum(r => r.AdjustedCredit);
    /// <summary>
    /// Mewakili Total Income Statement Debit.
    /// </summary>

    public decimal TotalIncomeStatementDebit => this.Rows.Sum(r => r.IncomeStatementDebit);
    /// <summary>
    /// Mewakili Total Income Statement Credit.
    /// </summary>

    public decimal TotalIncomeStatementCredit => this.Rows.Sum(r => r.IncomeStatementCredit);
    /// <summary>
    /// Mewakili Total Financial Position Debit.
    /// </summary>

    public decimal TotalFinancialPositionDebit => this.Rows.Sum(r => r.FinancialPositionDebit);
    /// <summary>
    /// Mewakili Total Financial Position Credit.
    /// </summary>

    public decimal TotalFinancialPositionCredit => this.Rows.Sum(r => r.FinancialPositionCredit);
}
/// <summary>
/// Mewakili Closing Journal Line.
/// </summary>

public class ClosingJournalLine
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public string? ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Debit.
    /// </summary>

    public decimal Debit { get; set; }
    /// <summary>
    /// Mewakili Credit.
    /// </summary>

    public decimal Credit { get; set; }
}
/// <summary>
/// Mewakili Closing Journal Entry Group.
/// </summary>

public class ClosingJournalEntryGroup
{
    /// <summary>
    /// Mewakili Description.
    /// </summary>
    public string Description { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<ClosingJournalLine> Lines { get; set; } = new();
    /// <summary>
    /// Mewakili Total Debit.
    /// </summary>

    public decimal TotalDebit => this.Lines.Sum(l => l.Debit);
    /// <summary>
    /// Mewakili Total Credit.
    /// </summary>

    public decimal TotalCredit => this.Lines.Sum(l => l.Credit);
}
/// <summary>
/// Model data Closing Journal View Model.
/// </summary>

public class ClosingJournalViewModel
{
    /// <summary>
    /// Mewakili Groups.
    /// </summary>
    public List<ClosingJournalEntryGroup> Groups { get; set; } = new();
    /// <summary>
    /// Mewakili Net Income.
    /// </summary>

    public decimal NetIncome { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Name.
    /// </summary>

    public string RetainedEarningsAccountName { get; set; } = "Retained Earnings";
}
