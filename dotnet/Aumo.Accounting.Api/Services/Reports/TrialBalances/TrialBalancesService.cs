using System.Linq;
using Microsoft.EntityFrameworkCore;
// <copyright file="TrialBalancesService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using System.Globalization;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs.Reports;
using Aumo.Accounting.Api.Models;

namespace Aumo.Accounting.Api.Services.Reports.TrialBalances;

/// <summary>
/// Layanan logika bisnis untuk kalkulasi 3 jenis Trial Balance.
/// </summary>
public class TrialBalancesService
{
    /// <summary>
    /// Proses eksekusi kalkulasi Unadjusted Trial Balance.
    /// </summary>
    public async Task<List<TrialBalanceUnadjustedRow>> BuildUnadjustedTrialBalanceAsync(
        AppDbContext db,
        Guid userId,
        Period period)
    {
        var rawRows = await this.BuildBaseTrialBalanceRowsAsync(db, userId, period, includeAdjusting: false, isPostClosing: false);

        var result = rawRows.Select(r => new TrialBalanceUnadjustedRow
        {
            UserId = userId,
            PeriodId = period.Id,
            AccountNumber = r.ReferenceNumber,
            AccountName = r.AccountName,
            DebitBalance = r.Debit,
            CreditBalance = r.Credit,
            IsTotalRow = false,
            CreatedAt = DateTimeOffset.UtcNow,
        }).ToList();

        // Menambahkan Baris Total di Bagian Paling Bawah
        result.Add(new TrialBalanceUnadjustedRow
        {
            UserId = userId,
            PeriodId = period.Id,
            AccountNumber = "TOTAL",
            AccountName = "Total Overall",
            DebitBalance = result.Sum(x => x.DebitBalance),
            CreditBalance = result.Sum(x => x.CreditBalance),
            IsTotalRow = true,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        return result;
    }

    /// <summary>
    /// Proses eksekusi kalkulasi Adjusted Trial Balance.
    /// </summary>
    public async Task<List<TrialBalanceAdjustedRow>> BuildAdjustedTrialBalanceAsync(
        AppDbContext db,
        Guid userId,
        Period period)
    {
        var rawRows = await this.BuildBaseTrialBalanceRowsAsync(db, userId, period, includeAdjusting: true, isPostClosing: false);

        var result = rawRows.Select(r => new TrialBalanceAdjustedRow
        {
            UserId = userId,
            PeriodId = period.Id,
            AccountNumber = r.ReferenceNumber,
            AccountName = r.AccountName,
            DebitBalance = r.Debit,
            CreditBalance = r.Credit,
            IsTotalRow = false,
            CreatedAt = DateTimeOffset.UtcNow,
        }).ToList();

        // Menambahkan Baris Total di Bagian Paling Bawah
        result.Add(new TrialBalanceAdjustedRow
        {
            UserId = userId,
            PeriodId = period.Id,
            AccountNumber = "TOTAL",
            AccountName = "Total Overall",
            DebitBalance = result.Sum(x => x.DebitBalance),
            CreditBalance = result.Sum(x => x.CreditBalance),
            IsTotalRow = true,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        return result;
    }

    /// <summary>
    /// Proses eksekusi kalkulasi Post-Closing Trial Balance.
    /// </summary>
    public async Task<List<TrialBalancePostClosingRow>> BuildPostClosingTrialBalanceAsync(
        AppDbContext db,
        Guid userId,
        Period period)
    {
        var rawRows = await this.BuildBaseTrialBalanceRowsAsync(db, userId, period, includeAdjusting: true, isPostClosing: true);

        var result = rawRows.Select(r => new TrialBalancePostClosingRow
        {
            UserId = userId,
            PeriodId = period.Id,
            AccountNumber = r.ReferenceNumber,
            AccountName = r.AccountName,
            DebitBalance = r.Debit,
            CreditBalance = r.Credit,
            IsTotalRow = false,
            CreatedAt = DateTimeOffset.UtcNow,
        }).ToList();

        // Menambahkan Baris Total di Bagian Paling Bawah
        result.Add(new TrialBalancePostClosingRow
        {
            UserId = userId,
            PeriodId = period.Id,
            AccountNumber = "TOTAL",
            AccountName = "Total Overall",
            DebitBalance = result.Sum(x => x.DebitBalance),
            CreditBalance = result.Sum(x => x.CreditBalance),
            IsTotalRow = true,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        return result;

    }

    /// <summary>
    /// Proses eksekusi kalkulasi Retained Earnings Ending.
    /// </summary>

    public async Task<decimal> ComputeRetainedEarningsEndingAsync(AppDbContext db, Guid userId, Period period)
    {
        var rows = await this.BuildBaseTrialBalanceRowsAsync(db, userId, period, includeAdjusting: true, isPostClosing: false);

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

    private async Task<List<InternalLedgerCalculation>> BuildBaseTrialBalanceRowsAsync(
        AppDbContext db,
        Guid userId,
        Period period,
        bool includeAdjusting,
        bool isPostClosing)
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

        var lines = includeAdjusting
            ? await linesQuery.Where(l => l.JournalType == "General" || l.JournalType == "Adjusting").ToListAsync()
            : await linesQuery.Where(l => l.JournalType == "General").ToListAsync();

        var rows = new List<InternalLedgerCalculation>();
        foreach (var account in accounts)
        {
            bool isPermanent = IsAccountPermanent(account);

            // Filter akun temporary jika tipe laporan adalah post-closing
            if (isPostClosing && !isPermanent)
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

            rows.Add(new InternalLedgerCalculation
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

    private sealed class InternalLedgerCalculation
    {
        public int AccountId { get; set; }

        public string ReferenceNumber { get; set; } = string.Empty;

        public string AccountName { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string? Role { get; set; }

        public bool NormalBalanceIsDebit { get; set; }

        public decimal NetBalance { get; set; }

        public decimal Debit { get; set; }

        public decimal Credit { get; set; }
    }
}
