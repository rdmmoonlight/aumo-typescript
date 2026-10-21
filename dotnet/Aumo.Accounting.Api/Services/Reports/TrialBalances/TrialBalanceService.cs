// <copyright file="TrialBalanceService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.Reports.TrialBalances;

using System.Globalization;

using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;
using TrialBalanceRow = Aumo.Accounting.Api.DTOs.Reports.TrialBalanceRow;
/// <summary>
/// Layanan logika bisnis untuk I Trial Balance Service.
/// </summary>

public interface ITrialBalanceService
{
    Task<List<TrialBalanceRow>> BuildTrialBalanceRowsAsync(
        AppDbContext db,
        Guid userId,
        Period period,
        bool includeAdjusting = false,
        string reportType = "unadjusted");

    Task<decimal> ComputeRetainedEarningsEndingAsync(AppDbContext db, Guid userId, Period period);
}
/// <summary>
/// Layanan logika bisnis untuk Trial Balance Service.
/// </summary>

public class TrialBalanceService : ITrialBalanceService
{
    /// <summary>
    /// Proses eksekusi kalkulasi Build Trial Balance Rows Async.
    /// </summary>
    public async Task<List<TrialBalanceRow>> BuildTrialBalanceRowsAsync(
        AppDbContext db,
        Guid userId,
        Period period,
        bool includeAdjusting = false,
        string reportType = "unadjusted")
    {
        var accounts = await db.ChartOfAccounts
            .Where(a => a.IsActive && a.UserId == userId)
            .OrderBy(a => a.ReferenceNumber)
            .ToListAsync();

        var accountIds = accounts.Select(a => a.Id).ToList();

        var startUtc = DateTime.SpecifyKind(period.StartDate.Date, DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(period.EndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        var linesQuery = db.GeneralJournals
            .Where(l => accountIds.Contains(l.AccountId)
                     && l.UserId == userId
                     && l.EntryDate >= startUtc
                     && l.EntryDate <= endUtc);

        bool includeAdjustingLines = includeAdjusting || reportType == "adjusted" || reportType == "post-closing";

        var lines = includeAdjustingLines
            ? await linesQuery.Where(l => l.JournalType == "General"
                                       || l.JournalType == "Adjusting").ToListAsync()
            : await linesQuery.Where(l => l.JournalType == "General").ToListAsync();

        var rows = new List<TrialBalanceRow>();
        foreach (var account in accounts)
        {
            bool isPermanent = IsAccountPermanent(account);

            if (reportType == "post-closing" && !isPermanent)
            {
                continue;
            }

            var accountLines = lines.Where(l => l.AccountId == account.Id).ToList();
            if (accountLines.Count == 0)
            {
                continue;
            }

            bool normalDebit = IsAccountNormalBalanceDebit(account);

            decimal totalDebitLines = accountLines.Sum(l => l.Debit);
            decimal totalCreditLines = accountLines.Sum(l => l.Credit);

            decimal netBalance = normalDebit
                ? (totalDebitLines - totalCreditLines)
                : (totalCreditLines - totalDebitLines);

            decimal debit = 0m;
            decimal credit = 0m;

            if (totalDebitLines >= totalCreditLines)
            {
                debit = totalDebitLines - totalCreditLines;
            }
            else
            {
                credit = totalCreditLines - totalDebitLines;
            }

            rows.Add(new TrialBalanceRow
            {
                AccountId = account.Id,
                ReferenceNumber = account.ReferenceNumber.ToString(CultureInfo.InvariantCulture),
                AccountName = account.AccountName,
                Type = account.Type,
                Role = account.Role,
                NormalBalanceIsDebit = normalDebit,
                NetBalance = netBalance,
                Debit = debit,
                Credit = credit,
            });
        }

        return rows;
    }
    /// <summary>
    /// Proses eksekusi kalkulasi Compute Retained Earnings Ending Async.
    /// </summary>

    public async Task<decimal> ComputeRetainedEarningsEndingAsync(AppDbContext db, Guid userId, Period period)
    {
        var rows = await this.BuildTrialBalanceRowsAsync(db, userId, period, includeAdjusting: true, reportType: "adjusted");

        decimal totalRevenue = rows
            .Where(r => !r.NormalBalanceIsDebit && IsTemporaryType(r.Type))
            .Sum(r => r.NetBalance);

        decimal totalExpense = rows
            .Where(r => r.NormalBalanceIsDebit && IsTemporaryType(r.Type))
            .Sum(r => r.NetBalance);

        decimal netIncome = totalRevenue - totalExpense;

        var reRow = rows.FirstOrDefault(r => string.Equals(r.Role ?? string.Empty, "RetainedEarnings", StringComparison.OrdinalIgnoreCase));
        decimal initialRE = reRow?.NetBalance ?? 0m;

        return initialRE + netIncome;
    }

    private static bool IsAccountNormalBalanceDebit(ChartOfAccount account)
    {
        if (string.IsNullOrEmpty(account.Type))
        {
            return false;
        }

        return AccountClassificationHelper.NormalBalanceIsDebit(account.Type);
    }

    private static bool IsAccountPermanent(ChartOfAccount account)
    {
        if (string.IsNullOrEmpty(account.Type))
        {
            return false;
        }

        return AccountClassificationHelper.IsPermanent(account.Type);
    }

    private static bool IsTemporaryType(string? typeStr)
    {
        if (string.IsNullOrEmpty(typeStr))
        {
            return false;
        }

        return AccountClassificationHelper.IsTemporary(typeStr);
    }
}
