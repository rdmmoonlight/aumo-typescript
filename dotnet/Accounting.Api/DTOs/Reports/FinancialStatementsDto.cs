// <copyright file="FinancialStatementsDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.DTOs.Reports;

using Accounting.Api.Controllers.Reports;
using Accounting.Api.DTOs;
using Accounting.Api.DTOs.Reports;
using Accounting.Api.Helpers;
using Accounting.Api.Models;


/// <summary>
/// Model data Income Statement Api Response.
/// </summary>

public class IncomeStatementApiResponse
{
    /// <summary>
    /// Mewakili Period Name.
    /// </summary>
    public string PeriodName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Start Date.
    /// </summary>

    public DateTime StartDate { get; set; }
    /// <summary>
    /// Mewakili End Date.
    /// </summary>

    public DateTime EndDate { get; set; }
    /// <summary>
    /// Mewakili As Of Date.
    /// </summary>

    public DateTime AsOfDate { get; set; }
    /// <summary>
    /// Mewakili Total Revenues.
    /// </summary>

    public decimal TotalRevenues { get; set; }
    /// <summary>
    /// Mewakili Total Expenses.
    /// </summary>

    public decimal TotalExpenses { get; set; }
    /// <summary>
    /// Mewakili Total Revenue.
    /// </summary>

    public decimal TotalRevenue { get; set; }
    /// <summary>
    /// Mewakili Total Operating Expenses.
    /// </summary>

    public decimal TotalOperatingExpenses { get; set; }
    /// <summary>
    /// Mewakili Operating Income.
    /// </summary>

    public decimal OperatingIncome { get; set; }
    /// <summary>
    /// Mewakili Other Income.
    /// </summary>

    public List<IncomeStatementLineApiResponse> OtherIncome { get; set; } = new();
    /// <summary>
    /// Mewakili Total Other Income.
    /// </summary>

    public decimal TotalOtherIncome { get; set; }
    /// <summary>
    /// Mewakili Other Expenses.
    /// </summary>

    public List<IncomeStatementLineApiResponse> OtherExpenses { get; set; } = new();
    /// <summary>
    /// Mewakili Total Other Expenses.
    /// </summary>

    public decimal TotalOtherExpenses { get; set; }
    /// <summary>
    /// Mewakili Net Income.
    /// </summary>

    public decimal NetIncome { get; set; }
    /// <summary>
    /// Mewakili Revenues.
    /// </summary>

    public List<IncomeStatementLineApiResponse> Revenues { get; set; } = new();
    /// <summary>
    /// Mewakili Expenses.
    /// </summary>

    public List<IncomeStatementLineApiResponse> Expenses { get; set; } = new();
    /// <summary>
    /// Mewakili Operating Expenses.
    /// </summary>

    public List<IncomeStatementLineApiResponse> OperatingExpenses { get; set; } = new();
}
/// <summary>
/// Model data Income Statement Line Api Response.
/// </summary>

public class IncomeStatementLineApiResponse
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public string ReferenceNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Amount.
    /// </summary>

    public decimal Amount { get; set; }
}
/// <summary>
/// Model data Retained Earnings Api Response.
/// </summary>

public class RetainedEarningsApiResponse
{
    /// <summary>
    /// Mewakili Period Name.
    /// </summary>
    public string PeriodName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Start Date.
    /// </summary>

    public DateTime? StartDate { get; set; }
    /// <summary>
    /// Mewakili End Date.
    /// </summary>

    public DateTime? EndDate { get; set; }
    /// <summary>
    /// Mewakili Beginning Balance.
    /// </summary>

    public decimal BeginningBalance { get; set; }
    /// <summary>
    /// Mewakili Ending Balance.
    /// </summary>

    public decimal EndingBalance { get; set; }
    /// <summary>
    /// Mewakili Net Income.
    /// </summary>

    public decimal NetIncome { get; set; }
    /// <summary>
    /// Mewakili Dividends.
    /// </summary>

    public decimal Dividends { get; set; }
}
/// <summary>
/// Model data Statement Of Cash Flow Line Response.
/// </summary>

public class StatementOfCashFlowLineResponse
{
    /// <summary>
    /// Mewakili Activity Type.
    /// </summary>
    public string ActivityType { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Description.
    /// </summary>

    public string Description { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Amount.
    /// </summary>

    public decimal Amount { get; set; }
}
/// <summary>
/// Model data Statement Of Financial Position Api Response.
/// </summary>

public class StatementOfFinancialPositionApiResponse
{
    /// <summary>
    /// Mewakili Period Name.
    /// </summary>
    public string PeriodName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili As Of Date.
    /// </summary>

    public DateTime AsOfDate { get; set; }
    /// <summary>
    /// Mewakili Total Assets.
    /// </summary>

    public decimal TotalAssets { get; set; }
    /// <summary>
    /// Mewakili Total Liabilities.
    /// </summary>

    public decimal TotalLiabilities { get; set; }
    /// <summary>
    /// Mewakili Total Equity.
    /// </summary>

    public decimal TotalEquity { get; set; }
    /// <summary>
    /// Mewakili Total Liabilities And Equity.
    /// </summary>

    public decimal TotalLiabilitiesAndEquity { get; set; }
    /// <summary>
    /// Mewakili Equity Excluding Retained Earnings.
    /// </summary>

    public List<FinancialPositionLineApiResponse> EquityExcludingRetainedEarnings { get; set; } = new();
    /// <summary>
    /// Mewakili Retained Earnings Ending.
    /// </summary>

    public decimal RetainedEarningsEnding { get; set; }
    /// <summary>
    /// Mewakili Is Post Closing.
    /// </summary>

    public bool IsPostClosing { get; set; }
    /// <summary>
    /// Mewakili Is Balanced.
    /// </summary>

    public bool IsBalanced { get; set; }
    /// <summary>
    /// Mewakili Assets.
    /// </summary>

    public List<FinancialPositionLineApiResponse> Assets { get; set; } = new();
    /// <summary>
    /// Mewakili Liabilities.
    /// </summary>

    public List<FinancialPositionLineApiResponse> Liabilities { get; set; } = new();
    /// <summary>
    /// Mewakili Equity.
    /// </summary>

    public List<FinancialPositionLineApiResponse> Equity { get; set; } = new();
}
/// <summary>
/// Model data Financial Position Line Api Response.
/// </summary>

public class FinancialPositionLineApiResponse
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public string ReferenceNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Amount.
    /// </summary>

    public decimal Amount { get; set; }
}
/// <summary>
/// Mewakili Cash Flow Line.
/// </summary>

public class CashFlowLine
{
    /// <summary>
    /// Mewakili Description.
    /// </summary>
    public string Description { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Amount.
    /// </summary>

    public decimal Amount { get; set; }
}
/// <summary>
/// Mewakili Income Statement Line.
/// </summary>

public class IncomeStatementLine
{
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>
    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Amount.
    /// </summary>

    public decimal Amount { get; set; }
}
/// <summary>
/// Mewakili Financial Position Line.
/// </summary>

public class FinancialPositionLine
{
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>
    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Balance.
    /// </summary>

    public decimal Balance { get; set; }
    /// <summary>
    /// Mewakili Amount.
    /// </summary>

    public decimal Amount { get; set; }
}
