// <copyright file="FinancialStatementsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs.Reports;
using Aumo.Accounting.Api.Models;
using Aumo.Accounting.Api.Services.Reports.TrialBalances;
using TrialBalanceRow = Aumo.Accounting.Api.DTOs.Reports.TrialBalanceRow;
/// <summary>
/// Layanan logika bisnis untuk I Financial Report Service.
/// </summary>
namespace Aumo.Accounting.Api.Services.Reports.FinancialStatements;

public interface IFinancialStatementsService
{
    IncomeStatementApiResponse BuildIncomeStatement(List<TrialBalanceRow> rows, Period period);

    Task<RetainedEarningsApiResponse> BuildRetainedEarningsAsync(AppDbContext db, Guid userId, Period period);

    Task<StatementOfFinancialPositionApiResponse> BuildSofpAsync(AppDbContext db, Guid userId, Period period, bool isPostClosing);
}
/// <summary>
/// Layanan logika bisnis untuk Financial Report Service.
/// </summary>

public class FinancialStatementsService : IFinancialStatementsService
{
    private readonly ITrialBalanceService trialBalanceService;

    /// <summary>
    /// Initializes a new instance of the <see cref="FinancialStatementsService"/> class.
    /// </summary>
    /// <param name="trialBalanceService">Layanan neraca saldo.</param>
    public FinancialStatementsService(ITrialBalanceService trialBalanceService)
    {
        this.trialBalanceService = trialBalanceService;
    }

    /// <summary>
    /// Proses eksekusi kalkulasi Build Income Statement.
    /// </summary>
    public IncomeStatementApiResponse BuildIncomeStatement(List<TrialBalanceRow> rows, Period period)
    {
        IncomeStatementLineApiResponse ToLine(TrialBalanceRow r) => new()
        {
            ReferenceNumber = r.ReferenceNumber ?? string.Empty,
            AccountName = r.AccountName,
            Amount = r.NetBalance,
        };

        var revenues = rows.Where(r => r.Type == "OperatingIncome").Select(ToLine).ToList();
        var operatingExpenses = rows.Where(r => r.Type == "OperatingExpenses").Select(ToLine).ToList();
        var otherIncome = rows.Where(r => r.Type == "OtherIncome").Select(ToLine).ToList();
        var otherExpenses = rows.Where(r => r.Type == "OtherExpenses").Select(ToLine).ToList();

        decimal totalRevenue = revenues.Sum(r => r.Amount);
        decimal totalOperatingExpenses = operatingExpenses.Sum(e => e.Amount);
        decimal operatingIncome = totalRevenue - totalOperatingExpenses;

        decimal totalOtherIncome = otherIncome.Sum(i => i.Amount);
        decimal totalOtherExpenses = otherExpenses.Sum(e => e.Amount);

        decimal netIncome = operatingIncome + totalOtherIncome - totalOtherExpenses;

        return new IncomeStatementApiResponse
        {
            AsOfDate = period.EndDate,
            Revenues = revenues,
            TotalRevenue = totalRevenue,
            OperatingExpenses = operatingExpenses,
            TotalOperatingExpenses = totalOperatingExpenses,
            OperatingIncome = operatingIncome,
            OtherIncome = otherIncome,
            TotalOtherIncome = totalOtherIncome,
            OtherExpenses = otherExpenses,
            TotalOtherExpenses = totalOtherExpenses,
            NetIncome = netIncome,
        };
    }
    /// <summary>
    /// Proses eksekusi kalkulasi Build Retained Earnings Async.
    /// </summary>

    public async Task<RetainedEarningsApiResponse> BuildRetainedEarningsAsync(AppDbContext db, Guid userId, Period period)
    {
        var rows = await this.trialBalanceService.BuildTrialBalanceRowsAsync(db, userId, period, true);
        var incomeStatement = this.BuildIncomeStatement(rows, period);

        var reAccount = rows.Find(r => r.Role == "RetainedEarnings");

        decimal beginningBalance = reAccount?.NetBalance ?? 0m;
        decimal netIncome = incomeStatement.NetIncome;
        decimal dividends = 0m;
        decimal endingBalance = beginningBalance + netIncome - dividends;

        return new RetainedEarningsApiResponse
        {
            AccountName = reAccount?.AccountName ?? "Retained Earnings",
            StartDate = period.StartDate,
            EndDate = period.EndDate,
            BeginningBalance = beginningBalance,
            NetIncome = netIncome,
            Dividends = dividends,
            EndingBalance = endingBalance,
        };
    }
    /// <summary>
    /// Proses eksekusi kalkulasi Build Sofp Async.
    /// </summary>

    public async Task<StatementOfFinancialPositionApiResponse> BuildSofpAsync(AppDbContext db, Guid userId, Period period, bool isPostClosing)
    {
        var rows = await this.trialBalanceService.BuildTrialBalanceRowsAsync(db, userId, period, true);
        var re = await this.BuildRetainedEarningsAsync(db, userId, period);

        FinancialPositionLineApiResponse ToLine(TrialBalanceRow r) => new()
        {
            ReferenceNumber = r.ReferenceNumber ?? string.Empty,
            AccountName = r.AccountName ?? string.Empty,
            Amount = r.NetBalance,
        };

        var assets = rows.Where(r => r.Type == "Assets").Select(ToLine).ToList();
        var liabilities = rows.Where(r => r.Type == "Liabilities").Select(ToLine).ToList();
        var equityExcludingRe = rows.Where(r => r.Type == "Equity" && r.Role != "RetainedEarnings").Select(ToLine).ToList();

        decimal totalAssets = assets.Sum(a => a.Amount);
        decimal totalLiabilities = liabilities.Sum(l => l.Amount);
        decimal totalEquityExcludingRe = equityExcludingRe.Sum(e => e.Amount);
        decimal retainedEarningsEnding = re.EndingBalance;

        decimal totalEquity = totalEquityExcludingRe + retainedEarningsEnding;
        decimal totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        bool isBalanced = Math.Round(totalAssets - totalLiabilitiesAndEquity, 2) == 0;

        return new StatementOfFinancialPositionApiResponse
        {
            AsOfDate = period.EndDate,
            IsPostClosing = isPostClosing,
            Assets = assets,
            TotalAssets = totalAssets,
            Liabilities = liabilities,
            TotalLiabilities = totalLiabilities,
            EquityExcludingRetainedEarnings = equityExcludingRe,
            RetainedEarningsEnding = retainedEarningsEnding,
            TotalEquity = totalEquity,
            TotalLiabilitiesAndEquity = totalLiabilitiesAndEquity,
            IsBalanced = isBalanced,
        };
    }
}
