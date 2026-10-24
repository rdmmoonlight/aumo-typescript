// <copyright file="FinancialStatementsController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Controllers.Reports;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Accounting.Api.Controllers.Reports;
using Accounting.Api.Data;
using Accounting.Api.DTOs;
using Accounting.Api.DTOs.Reports;
using Accounting.Api.Helpers;
using Accounting.Api.Models;
using Accounting.Api.Services;
using Accounting.Api.Services.Reports.FinancialStatements;
using Accounting.Api.Services.Reports.TrialBalances;


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
/// <summary>
/// Controller API untuk mengelola Financial Statements.
/// </summary>

[ApiController]
[Route("/reports")]
[Authorize]


public class FinancialStatementsController : ControllerBase
{
    private readonly AppDbContext db;
    private readonly IFinancialStatementsService reportService;
    private readonly ITrialBalanceService trialBalanceService;
    /// <summary>
    /// Controller API untuk mengelola Financial Statements.
    /// </summary>

    public FinancialStatementsController(AppDbContext db, IFinancialStatementsService reportService, ITrialBalanceService trialBalanceService)
    {
        this.db = db;
        this.reportService = reportService;
        this.trialBalanceService = trialBalanceService;
    }
    /// <summary>
    /// Mengambil data  Income Statement.
    /// </summary>

    // ========================================== null;
    // 1. GET: /reports/income-statement
    // ========================================== null;
    [HttpGet("income-statement")]
    public async Task<IActionResult> GetIncomeStatement()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var period = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
        if (period == null)
        {
            return this.Ok(new
            {
                success = true,
                hasPeriodSelected = false,
                message = "No accounting period selected.",
                selectedPeriodName = (string?)null,
                revenueAccounts = Array.Empty<object>(),
                expenseAccounts = Array.Empty<object>(),
                otherIncomeAccounts = Array.Empty<object>(),
                otherExpenseAccounts = Array.Empty<object>(),
            });
        }

        var rows = await this.trialBalanceService.BuildTrialBalanceRowsAsync(this.db, userId, period, true);
        var statementData = this.reportService.BuildIncomeStatement(rows, period);


        return this.Ok(new
        {
            success = true,
            hasPeriodSelected = true,
            selectedPeriodName = period.PeriodName,
            asOfDate = statementData.AsOfDate,
            revenueAccounts = statementData.Revenues,
            totalRevenue = statementData.TotalRevenue,
            expenseAccounts = statementData.OperatingExpenses,
            totalExpenses = statementData.TotalOperatingExpenses,
            operatingIncome = statementData.OperatingIncome,
            otherIncomeAccounts = statementData.OtherIncome,
            otherExpenseAccounts = statementData.OtherExpenses,
            totalOtherIncome = statementData.TotalOtherIncome,
            totalOtherExpenses = statementData.TotalOtherExpenses,
            netIncome = statementData.NetIncome,
        });
    }
    /// <summary>
    /// Mengambil data  Retained Earnings.
    /// </summary>

    // ========================================== null;
    // 2. GET: /reports/retained-earnings
    // ========================================== null;
    [HttpGet("retained-earnings")]
    public async Task<IActionResult> GetRetainedEarnings()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var period = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
        if (period == null)
        {
            return this.Ok(new
            {
                success = true,
                hasPeriodSelected = false,
                message = "No accounting period selected.",
                selectedPeriodName = (string?)null,
                accountName = "Retained Earnings",
                startDate = (DateTime?)null,
                endDate = (DateTime?)null,
                beginningRetainedEarnings = 0m,
                netIncome = 0m,
                dividendsOrDraws = 0m,
                endingRetainedEarnings = 0m,
            });
        }

        var statementData = await this.reportService.BuildRetainedEarningsAsync(this.db, userId, period);

        return this.Ok(new
        {
            success = true,
            hasPeriodSelected = true,
            selectedPeriodName = period.PeriodName,
            accountName = statementData.AccountName,
            startDate = statementData.StartDate,
            endDate = statementData.EndDate,
            beginningRetainedEarnings = statementData.BeginningBalance,
            netIncome = statementData.NetIncome,
            dividendsOrDraws = statementData.Dividends,
            endingRetainedEarnings = statementData.EndingBalance,
        });
    }
    /// <summary>
    /// Mengambil data  Cash Flow Statement.
    /// </summary>

    // ========================================== null;
    // 3. GET: /reports/statement-of-cash-flow
    // ========================================== null;
    [HttpGet("statement-of-cash-flow")]
    public async Task<IActionResult> GetCashFlowStatement()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var period = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
        if (period == null)
        {
            return this.Ok(new
            {
                success = true,
                hasPeriodSelected = false,
                message = "No accounting period selected.",
                selectedPeriodName = (string?)null,
                operatingActivities = new List<StatementOfCashFlowLineResponse>(),
                netCashFromOperating = 0m,
                investingActivities = new List<StatementOfCashFlowLineResponse>(),
                netCashFromInvesting = 0m,
                financingActivities = new List<StatementOfCashFlowLineResponse>(),
                netCashFromFinancing = 0m,
                netChangeInCash = 0m,
                beginningCash = 0m,
                endingCash = 0m,
            });
        }

        var rows = await this.trialBalanceService.BuildTrialBalanceRowsAsync(this.db, userId, period, true);
        var incomeStatement = this.reportService.BuildIncomeStatement(rows, period);


        var cashRows = rows.Where(r => r.Role == "CashAndEquivalents").ToList();
        decimal endingCash = cashRows.Sum(r => r.NetBalance);

        var operatingActivities = new List<StatementOfCashFlowLineResponse>
        {
            new StatementOfCashFlowLineResponse
            {
                Description = "Net Income per Income Statement",
                Amount = incomeStatement.NetIncome
            },
        };

        var investingActivities = new List<StatementOfCashFlowLineResponse>();
        var financingActivities = new List<StatementOfCashFlowLineResponse>();

        foreach (var r in rows)
        {
            if (r.NetBalance == 0 || r.Role == "CashAndEquivalents" || r.Role == "RetainedEarnings")
            {
                continue;
            }

            if (int.TryParse(r.ReferenceNumber, out int refNum)) { /* parsed */ }

            if (AccountClassificationHelper.IsTemporary(r.Type ?? string.Empty) || refNum >= 400)
            {
                continue;
            }

            if (r.Type == "Assets" || (refNum >= 100 && refNum <= 199))
            {
                bool isFixedAsset = refNum >= 150 ||
                                    r.AccountName.Contains("Equipment", StringComparison.OrdinalIgnoreCase) ||
                                    r.AccountName.Contains("Depreciation", StringComparison.OrdinalIgnoreCase) ||
                                    r.AccountName.Contains("Asset", StringComparison.OrdinalIgnoreCase);

                if (isFixedAsset)
                {
                    investingActivities.Add(new StatementOfCashFlowLineResponse { Description = $"Capital expenditure / Sale of {r.AccountName}", Amount = -r.NetBalance });
                }
                else
                {
                    operatingActivities.Add(new StatementOfCashFlowLineResponse { Description = $"Change in {r.AccountName}", Amount = -r.NetBalance });
                }
            }
            else if (r.Type == "Liabilities" || (refNum >= 200 && refNum <= 299))
            {
                bool isLongTermDebt = refNum >= 250 ||
                                      r.AccountName.Contains("Bank Loan", StringComparison.OrdinalIgnoreCase) ||
                                      r.AccountName.Contains("Long Term", StringComparison.OrdinalIgnoreCase);

                if (isLongTermDebt)
                {
                    financingActivities.Add(new StatementOfCashFlowLineResponse { Description = $"Change in {r.AccountName}", Amount = r.NetBalance });
                }
                else
                {
                    operatingActivities.Add(new StatementOfCashFlowLineResponse { Description = $"Change in {r.AccountName}", Amount = r.NetBalance });
                }
            }
            else if (r.Type == "Equity" || (refNum >= 300 && refNum <= 399))
            {
                financingActivities.Add(new StatementOfCashFlowLineResponse { Description = $"Change in {r.AccountName}", Amount = r.NetBalance });
            }
            else
            {
                operatingActivities.Add(new StatementOfCashFlowLineResponse { Description = $"Adjustment for {r.AccountName}", Amount = -r.NetBalance });
            }
        }

        decimal netOperating = operatingActivities.Sum(a => a.Amount);
        decimal netInvesting = investingActivities.Sum(a => a.Amount);
        decimal netFinancing = financingActivities.Sum(a => a.Amount);

        decimal netChangeInCash = netOperating + netInvesting + netFinancing;
        decimal beginningCash = endingCash - netChangeInCash;

        return this.Ok(new
        {
            success = true,
            hasPeriodSelected = true,
            selectedPeriodName = period.PeriodName,
            operatingActivities = operatingActivities,
            netCashFromOperating = netOperating,
            investingActivities = investingActivities,
            netCashFromInvesting = netInvesting,
            financingActivities = financingActivities,
            netCashFromFinancing = netFinancing,
            netChangeInCash = netChangeInCash,
            beginningCash = beginningCash,
            endingCash = endingCash,
        });
    }
    /// <summary>
    /// Mengambil data  Statement Of Financial Position.
    /// </summary>

    // ========================================== null;
    // 4. GET: /reports/statement-of-financial-position
    // ========================================== null;
    [HttpGet("statement-of-financial-position")]
    public async Task<IActionResult> GetStatementOfFinancialPosition([FromQuery] bool isPostClosing = false)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var period = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
        if (period == null)
        {
            return this.Ok(new
            {
                success = true,
                hasPeriodSelected = false,
                message = "No accounting period selected.",
                selectedPeriodName = (string?)null,
                assetAccounts = new List<object>(),
                totalAssets = 0m,
                liabilityAccounts = new List<object>(),
                totalLiabilities = 0m,
                equityAccounts = new List<object>(),
                totalEquity = 0m,
                totalLiabilitiesAndEquity = 0m,
                isBalanced = true,
            });
        }

        var balanceSheetData = await this.reportService.BuildSofpAsync(this.db, userId, period, isPostClosing);

        var equityAccountsWithRe = balanceSheetData.EquityExcludingRetainedEarnings
            .Select(e => new { accountId = 0, referenceNumber = e.ReferenceNumber ?? string.Empty, accountName = e.AccountName, amount = e.Amount })
            .Append(new { accountId = 0, referenceNumber = "0", accountName = "Retained Earnings", amount = balanceSheetData.RetainedEarningsEnding })
            .ToList();

        return this.Ok(new
        {
            success = true,
            hasPeriodSelected = true,
            selectedPeriodName = period.PeriodName,
            asOfDate = balanceSheetData.AsOfDate,
            isPostClosing = balanceSheetData.IsPostClosing,
            assetAccounts = balanceSheetData.Assets.Select(a => new { accountId = 0, referenceNumber = a.ReferenceNumber, accountName = a.AccountName, amount = a.Amount }),
            totalAssets = balanceSheetData.TotalAssets,
            liabilityAccounts = balanceSheetData.Liabilities.Select(l => new { accountId = 0, referenceNumber = l.ReferenceNumber, accountName = l.AccountName, amount = l.Amount }),
            totalLiabilities = balanceSheetData.TotalLiabilities,
            equityAccounts = equityAccountsWithRe,
            totalEquity = balanceSheetData.TotalEquity,
            totalLiabilitiesAndEquity = balanceSheetData.TotalLiabilitiesAndEquity,
            isBalanced = balanceSheetData.IsBalanced,
        });
    }

    private Guid GetCurrentUserId()
    {
        var userIdStr = this.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? this.User.FindFirstValue("sub");

        return Guid.TryParse(userIdStr, out Guid userId) ? userId : Guid.Empty;
    }
}
