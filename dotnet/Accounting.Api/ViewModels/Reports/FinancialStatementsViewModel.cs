// <copyright file="FinancialStatementsViewModel.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.ViewModels.Reports;

using System;
using System.Collections.Generic;
using System.Linq;
using Accounting.Api.Controllers.Reports;
using Accounting.Api.DTOs;
using Accounting.Api.DTOs.Reports;
using Accounting.Api.Helpers;
using Accounting.Api.Models;


/// <summary>
/// Model data Cash Flow Statement View Model.
/// </summary>

public class CashFlowStatementViewModel
{
    /// <summary>
    /// Mewakili Beginning Cash.
    /// </summary>
    public decimal BeginningCash { get; set; }
    /// <summary>
    /// Mewakili Operating Activities.
    /// </summary>

    public List<CashFlowLine> OperatingActivities { get; set; } = new();
    /// <summary>
    /// Mewakili Investing Activities.
    /// </summary>

    public List<CashFlowLine> InvestingActivities { get; set; } = new();
    /// <summary>
    /// Mewakili Financing Activities.
    /// </summary>

    public List<CashFlowLine> FinancingActivities { get; set; } = new();
    /// <summary>
    /// Mewakili Net Operating.
    /// </summary>

    public decimal NetOperating => this.OperatingActivities.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Net Investing.
    /// </summary>

    public decimal NetInvesting => this.InvestingActivities.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Net Financing.
    /// </summary>

    public decimal NetFinancing => this.FinancingActivities.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Net Change In Cash.
    /// </summary>

    public decimal NetChangeInCash => this.NetOperating + this.NetInvesting + this.NetFinancing;
    /// <summary>
    /// Mewakili Ending Cash.
    /// </summary>

    public decimal EndingCash => this.BeginningCash + this.NetChangeInCash;
}
/// <summary>
/// Model data Income Statement View Model.
/// </summary>

public class IncomeStatementViewModel
{
    /// <summary>
    /// Mewakili As Of Date.
    /// </summary>
    public DateTime AsOfDate { get; set; }
    /// <summary>
    /// Mewakili Revenues.
    /// </summary>

    public List<IncomeStatementLine> Revenues { get; set; } = new();
    /// <summary>
    /// Mewakili Operating Expenses.
    /// </summary>

    public List<IncomeStatementLine> OperatingExpenses { get; set; } = new();
    /// <summary>
    /// Mewakili Other Income.
    /// </summary>

    public List<IncomeStatementLine> OtherIncome { get; set; } = new();
    /// <summary>
    /// Mewakili Other Expenses.
    /// </summary>

    public List<IncomeStatementLine> OtherExpenses { get; set; } = new();
    /// <summary>
    /// Mewakili Total Revenue.
    /// </summary>

    public decimal TotalRevenue => this.Revenues.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Total Operating Expenses.
    /// </summary>

    public decimal TotalOperatingExpenses => this.OperatingExpenses.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Operating Income.
    /// </summary>

    public decimal OperatingIncome => this.TotalRevenue - this.TotalOperatingExpenses;
    /// <summary>
    /// Mewakili Total Other Income.
    /// </summary>

    public decimal TotalOtherIncome => this.OtherIncome.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Total Other Expenses.
    /// </summary>

    public decimal TotalOtherExpenses => this.OtherExpenses.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Net Income.
    /// </summary>

    public decimal NetIncome => this.OperatingIncome + this.TotalOtherIncome - this.TotalOtherExpenses;
}
/// <summary>
/// Model data Statement Of Financial Position View Model.
/// </summary>

public class StatementOfFinancialPositionViewModel
{
    /// <summary>
    /// Mewakili As Of Date.
    /// </summary>
    public DateTime AsOfDate { get; set; }
    /// <summary>
    /// Mewakili Is Post Closing.
    /// </summary>

    public bool IsPostClosing { get; set; }
    /// <summary>
    /// Mewakili Assets.
    /// </summary>

    public List<FinancialPositionLine> Assets { get; set; } = new();
    /// <summary>
    /// Mewakili Liabilities.
    /// </summary>

    public List<FinancialPositionLine> Liabilities { get; set; } = new();
    /// <summary>
    /// Mewakili Equity Excluding Retained Earnings.
    /// </summary>

    public List<FinancialPositionLine> EquityExcludingRetainedEarnings { get; set; } = new();
    /// <summary>
    /// Mewakili Retained Earnings Ending.
    /// </summary>

    public decimal RetainedEarningsEnding { get; set; }
    /// <summary>
    /// Mewakili Total Assets.
    /// </summary>

    public decimal TotalAssets => this.Assets.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Total Liabilities.
    /// </summary>

    public decimal TotalLiabilities => this.Liabilities.Sum(l => l.Amount);
    /// <summary>
    /// Mewakili Total Equity.
    /// </summary>

    public decimal TotalEquity => this.EquityExcludingRetainedEarnings.Sum(l => l.Amount) + this.RetainedEarningsEnding;
    /// <summary>
    /// Mewakili Total Liabilities And Equity.
    /// </summary>

    public decimal TotalLiabilitiesAndEquity => this.TotalLiabilities + this.TotalEquity;
    /// <summary>
    /// Mewakili Is Balanced.
    /// </summary>

    public bool IsBalanced => Math.Round(this.TotalAssets - this.TotalLiabilitiesAndEquity, 2) == 0;
}
/// <summary>
/// Model data Retained Earnings View Model.
/// </summary>

public class RetainedEarningsViewModel
{
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>
    public string AccountName { get; set; } = "Retained Earnings";
    /// <summary>
    /// Mewakili Start Date.
    /// </summary>

    public DateTime StartDate { get; set; }
    /// <summary>
    /// Mewakili End Date.
    /// </summary>

    public DateTime EndDate { get; set; }
    /// <summary>
    /// Mewakili Beginning Balance.
    /// </summary>

    public decimal BeginningBalance { get; set; }
    /// <summary>
    /// Mewakili Net Income.
    /// </summary>

    public decimal NetIncome { get; set; }
    /// <summary>
    /// Mewakili Dividends.
    /// </summary>

    public decimal Dividends { get; set; }
    /// <summary>
    /// Mewakili Ending Balance.
    /// </summary>

    public decimal EndingBalance => this.BeginningBalance + this.NetIncome - this.Dividends;
}
