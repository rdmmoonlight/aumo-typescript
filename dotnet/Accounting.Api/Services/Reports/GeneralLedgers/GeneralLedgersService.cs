using System.Globalization;
// <copyright file="GeneralLedgersService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Services.Reports.GeneralLedgers;

using Accounting.Api.Data;
using Accounting.Api.DTOs;
using Accounting.Api.DTOs.Reports;
using Accounting.Api.Helpers;
using Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Layanan logika bisnis untuk General Ledgers Service.
/// </summary>

public class GeneralLedgersService : IGeneralLedgersService
{
    private readonly AppDbContext db;

    private static readonly string[] PermanentTypes = { "Assets", "Asset", "Liabilities", "Liability", "Equity" };
    private static readonly string[] TemporaryTypes = { "OperatingIncome", "OtherIncome", "Income", "Revenue", "OperatingExpenses", "OtherExpenses", "Expense", "Expenses" };
    private static readonly string[] RevenueTypes = { "OperatingIncome", "OtherIncome", "Revenue", "Income" };
    private static readonly string[] ExpenseTypes = { "OperatingExpenses", "OtherExpenses", "Expense", "Expenses" };

    /// <summary>
    /// Initializes a new instance of the <see cref="GeneralLedgersService"/> class.
    /// </summary>
    /// <param name="db">Konteks database aplikasi.</param>
    public GeneralLedgersService(AppDbContext db) => this.db = db;
    /// <summary>
    /// Mengambil data  Permanent Ledgers Async.
    /// </summary>

    public async Task<BaseServiceResult<PermanentLedgerGroupedResponse>> GetPermanentLedgersAsync(Guid userId)
    {
        var period = await this.ResolveSelectedPeriodAsync(userId);
        if (period == null)
        {
            return new BaseServiceResult<PermanentLedgerGroupedResponse> { Success = false, Message = "No accounting period selected." };
        }

        // 1. Cek apakah data staging perlu di-refresh (jika kosong ATAU ada data jurnal terbaru)
        bool needsRefresh = !await this.HasStagingDataAsync(userId, period.Id, isPermanent: true)
                           || await this.IsLedgerStaleAsync(userId, period);

        if (needsRefresh)
        {
            var r = await this.RefreshGeneralLedgersAsync(userId);
            if (!r.Success)
            {
                return new BaseServiceResult<PermanentLedgerGroupedResponse> { Success = false, Message = r.Message };
            }
        }

        var flat = await this.FetchPermanentDtosAsync(userId, period.Id);
        var grouped = MapToGrouped(flat);

        return new BaseServiceResult<PermanentLedgerGroupedResponse>
        {
            Success = true,
            Data = new PermanentLedgerGroupedResponse { SelectedPeriodName = period.PeriodName, Accounts = grouped },
        };
    }
    /// <summary>
    /// Mengambil data  Temporary Ledgers Async.
    /// </summary>

    public async Task<BaseServiceResult<TemporaryLedgerGroupedResponse>> GetTemporaryLedgersAsync(Guid userId)
    {
        var period = await this.ResolveSelectedPeriodAsync(userId);
        if (period == null)
        {
            return new BaseServiceResult<TemporaryLedgerGroupedResponse> { Success = false, Message = "No accounting period selected." };
        }

        // 1. Cek apakah data staging perlu di-refresh (jika kosong ATAU ada data jurnal terbaru)
        bool needsRefresh = !await this.HasStagingDataAsync(userId, period.Id, isPermanent: false)
                           || await this.IsLedgerStaleAsync(userId, period);

        if (needsRefresh)
        {
            var r = await this.RefreshGeneralLedgersAsync(userId);
            if (!r.Success)
            {
                return new BaseServiceResult<TemporaryLedgerGroupedResponse> { Success = false, Message = r.Message };
            }
        }

        var flat = await this.FetchTemporaryDtosAsync(userId, period.Id);
        var grouped = MapToGrouped(flat);

        decimal totalRev = flat.Where(x => RevenueTypes.Contains(x.AccountType, StringComparer.OrdinalIgnoreCase)).Sum(x => x.Credit - x.Debit);
        decimal totalExp = flat.Where(x => ExpenseTypes.Contains(x.AccountType, StringComparer.OrdinalIgnoreCase)).Sum(x => x.Debit - x.Credit);

        return new BaseServiceResult<TemporaryLedgerGroupedResponse>
        {
            Success = true,
            Data = new TemporaryLedgerGroupedResponse
            {
                SelectedPeriodName = period.PeriodName,
                NetIncomeBeforeClosing = totalRev - totalExp,
                Accounts = grouped
            },
        };
    }
    /// <summary>
    /// Proses eksekusi kalkulasi Refresh General Ledgers Async.
    /// </summary>

    public async Task<BaseServiceResult> RefreshGeneralLedgersAsync(Guid userId)
    {
        var selectedPeriod = await this.ResolveSelectedPeriodAsync(userId);
        if (selectedPeriod == null)
        {
            return new BaseServiceResult { Success = false, Message = "No period is currently selected." };
        }

        var strategy = this.db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            this.db.ChangeTracker.Clear();
            await using var tx = await this.db.Database.BeginTransactionAsync();
            try
            {
                await this.ClearLedgerDataForPeriodAsync(userId, selectedPeriod.Id);

                var start = DateTime.SpecifyKind(selectedPeriod.StartDate.Date, DateTimeKind.Utc);
                var end = DateTime.SpecifyKind(selectedPeriod.EndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

                var lines = await this.db.GeneralJournals.AsNoTracking()
                    .Include(l => l.Account)
                    .Where(l => l.UserId == userId && l.EntryDate >= start && l.EntryDate <= end)
                    .OrderBy(l => l.AccountId).ThenBy(l => l.EntryDate).ThenBy(l => l.JournalEntryId).ThenBy(l => l.LineOrder)
                    .ToListAsync();

                if (lines.Count == 0)
                {
                    await tx.CommitAsync();
                    return new BaseServiceResult { Success = true, Message = $"General Ledger refreshed for period {selectedPeriod.PeriodName} (0 transactions found)." };
                }

                var permanents = new List<GeneralLedgerPermanentAccount>();
                var temporaries = new List<GeneralLedgerTemporaryAccount>();

                foreach (var g in lines.GroupBy(l => l.AccountId))
                {
                    var acc = g.First().Account;
                    if (acc == null)
                    {
                        continue;
                    }

                    decimal running = 0;
                    bool isPermanent = PermanentTypes.Contains(acc.Type ?? string.Empty, StringComparer.OrdinalIgnoreCase);
                    bool isTemporary = TemporaryTypes.Contains(acc.Type ?? string.Empty, StringComparer.OrdinalIgnoreCase);
                    bool isDebitNormal = IsDebitNormal(acc.Type);

                    foreach (var line in g)
                    {
                        running += isDebitNormal ? (line.Debit - line.Credit) : (line.Credit - line.Debit);
                        if (isPermanent)
                        {
                            permanents.Add(new GeneralLedgerPermanentAccount { UserId = userId, PeriodId = selectedPeriod.Id, AccountId = line.AccountId, JournalEntryId = line.JournalEntryId, JournalEntryLineId = line.LineId, EntryDate = line.EntryDate, TransactionNumber = line.TransactionNumber, LineDescription = line.LineDescription, Debit = line.Debit, Credit = line.Credit, RunningBalance = running });
                        }
                        else if (isTemporary)
                        {
                            temporaries.Add(new GeneralLedgerTemporaryAccount { UserId = userId, PeriodId = selectedPeriod.Id, AccountId = line.AccountId, JournalEntryId = line.JournalEntryId, JournalEntryLineId = line.LineId, EntryDate = line.EntryDate, TransactionNumber = line.TransactionNumber, LineDescription = line.LineDescription, Debit = line.Debit, Credit = line.Credit, RunningBalance = running });
                        }
                    }
                }

                foreach (var permanent in permanents)
                {
                    this.db.GeneralLedgerPermanentAccounts.Add(permanent);
                }

                foreach (var temporary in temporaries)
                {
                    this.db.GeneralLedgerTemporaryAccounts.Add(temporary);
                }

                await this.db.SaveChangesAsync();
                await tx.CommitAsync();
                return new BaseServiceResult { Success = true, Message = $"General Ledger refreshed for period {selectedPeriod.PeriodName}." };
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return new BaseServiceResult { Success = false, Message = $"Failed to refresh: {ex.InnerException?.Message ?? ex.Message}" };
            }
        });
    }
    /// <summary>
    /// Mewakili Clear Selected Period Ledgers Async.
    /// </summary>

    public async Task<BaseServiceResult> ClearSelectedPeriodLedgersAsync(Guid userId)
    {
        var period = await this.ResolveSelectedPeriodAsync(userId);
        if (period == null)
        {
            return new BaseServiceResult { Success = true, Message = "No period selected. Clear skipped." };
        }

        await this.ClearLedgerDataForPeriodAsync(userId, period.Id);
        return new BaseServiceResult { Success = true, Message = $"Cleared staging for period {period.PeriodName}." };
    }

    // --- PRIVATE HELPERS ---

    private async Task<bool> IsLedgerStaleAsync(Guid userId, Models.Period period)
    {
        var start = DateTime.SpecifyKind(period.StartDate.Date, DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(period.EndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        // Hitung total baris jurnal transaksi yang ada di periode ini
        int totalJournalLines = await this.db.GeneralJournals.AsNoTracking()
            .CountAsync(l => l.UserId == userId && l.EntryDate >= start && l.EntryDate <= end);

        // Hitung total baris di staging ledger
        int permanentCount = await this.db.GeneralLedgerPermanentAccounts.AsNoTracking().CountAsync(x => x.UserId == userId && x.PeriodId == period.Id);
        int temporaryCount = await this.db.GeneralLedgerTemporaryAccounts.AsNoTracking().CountAsync(x => x.UserId == userId && x.PeriodId == period.Id);

        // Jika jumlah total record tidak sama, berarti data berubah / ada transaksi baru / terhapus
        if (totalJournalLines != (permanentCount + temporaryCount))
        {
            return true;
        }

        return false;
    }

    private Task<bool> HasStagingDataAsync(Guid userId, int periodId, bool isPermanent)
    {
        if (isPermanent)
        {
            return this.db.GeneralLedgerPermanentAccounts.AsNoTracking().AnyAsync(x => x.UserId == userId && x.PeriodId == periodId);
        }

        return this.db.GeneralLedgerTemporaryAccounts.AsNoTracking().AnyAsync(x => x.UserId == userId && x.PeriodId == periodId);
    }

    private async Task<Models.Period?> ResolveSelectedPeriodAsync(Guid userId)
    {
        var p = await this.db.Periods.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId && x.IsSelected);
        if (p != null)
        {
            return p;
        }

        var helper = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
        if (helper == null)
        {
            return null;
        }

        return await this.db.Periods.AsNoTracking().FirstOrDefaultAsync(x => x.Id == helper.Id && x.UserId == userId);
    }

    private Task<List<PermanentLedgerDto>> FetchPermanentDtosAsync(Guid userId, int periodId) =>
        this.db.GeneralLedgerPermanentAccounts.AsNoTracking().Include(x => x.Account)
           .Where(x => x.UserId == userId && x.PeriodId == periodId)
           .OrderBy(x => x.AccountId).ThenBy(x => x.EntryDate).ThenBy(x => x.Id)
           .Select(x => new PermanentLedgerDto { Id = (int)x.Id, AccountId = x.AccountId, AccountName = x.Account!.AccountName, AccountReferenceNumber = x.Account.ReferenceNumber, AccountType = x.Account.Type ?? string.Empty, JournalEntryId = x.JournalEntryId, JournalEntryLineId = x.JournalEntryLineId, EntryDate = x.EntryDate, TransactionNumber = x.TransactionNumber ?? string.Empty, LineDescription = x.LineDescription ?? string.Empty, Debit = x.Debit, Credit = x.Credit, RunningBalance = x.RunningBalance })
           .ToListAsync();

    private Task<List<TemporaryLedgerDto>> FetchTemporaryDtosAsync(Guid userId, int periodId) =>
        this.db.GeneralLedgerTemporaryAccounts.AsNoTracking().Include(x => x.Account)
           .Where(x => x.UserId == userId && x.PeriodId == periodId)
           .OrderBy(x => x.AccountId).ThenBy(x => x.EntryDate).ThenBy(x => x.Id)
           .Select(x => new TemporaryLedgerDto { Id = (int)x.Id, AccountId = x.AccountId, AccountName = x.Account!.AccountName, AccountReferenceNumber = x.Account.ReferenceNumber, AccountType = x.Account.Type ?? string.Empty, JournalEntryId = x.JournalEntryId, JournalEntryLineId = x.JournalEntryLineId, EntryDate = x.EntryDate, TransactionNumber = x.TransactionNumber ?? string.Empty, LineDescription = x.LineDescription ?? string.Empty, Debit = x.Debit, Credit = x.Credit, RunningBalance = x.RunningBalance })
           .ToListAsync();

    private static List<LedgerAccountResponse> MapToGrouped(List<PermanentLedgerDto> flat)
    {
        return flat.GroupBy(x => x.AccountId).Select(g =>
        {
            var first = g.First();
            bool isDebitNormal = IsDebitNormal(first.AccountType);
            var ordered = g.OrderBy(x => x.EntryDate).ThenBy(x => x.Id).ToList();
            decimal beginning = 0;
            if (ordered.Count > 0)
            {
                var f = ordered.First();
                var effect = isDebitNormal ? (f.Debit - f.Credit) : (f.Credit - f.Debit);
                beginning = f.RunningBalance - effect;
            }

            return new LedgerAccountResponse
            {
                AccountId = first.AccountId,
                ReferenceNumber = first.AccountReferenceNumber,
                AccountName = first.AccountName,
                AccountType = first.AccountType,
                Type = first.AccountType,
                NormalBalanceIsDebit = isDebitNormal,
                BeginningBalance = beginning,
                EndingBalance = ordered.LastOrDefault()?.RunningBalance ?? beginning,
                Lines = ordered.Select(x => new LedgerLineResponse
                {
                    JournalEntryId = x.JournalEntryId,
                    TransactionNumber = x.TransactionNumber,
                    EntryDate = x.EntryDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    Description = x.LineDescription,
                    Debit = x.Debit,
                    Credit = x.Credit,
                    RunningBalance = x.RunningBalance
                }).ToList(),
            };
        }).OrderBy(x => x.ReferenceNumber).ToList();
    }

    private static List<LedgerAccountResponse> MapToGrouped(List<TemporaryLedgerDto> flat)
    {
        return flat.GroupBy(x => x.AccountId).Select(g =>
        {
            var first = g.First();
            bool isDebitNormal = IsDebitNormal(first.AccountType);
            var ordered = g.OrderBy(x => x.EntryDate).ThenBy(x => x.Id).ToList();
            decimal beginning = 0;
            if (ordered.Count > 0)
            {
                var f = ordered.First();
                var effect = isDebitNormal ? (f.Debit - f.Credit) : (f.Credit - f.Debit);
                beginning = f.RunningBalance - effect;
            }

            return new LedgerAccountResponse
            {
                AccountId = first.AccountId,
                ReferenceNumber = first.AccountReferenceNumber,
                AccountName = first.AccountName,
                AccountType = first.AccountType,
                Type = first.AccountType,
                NormalBalanceIsDebit = isDebitNormal,
                BeginningBalance = beginning,
                EndingBalance = ordered.LastOrDefault()?.RunningBalance ?? beginning,
                Lines = ordered.Select(x => new LedgerLineResponse
                {
                    JournalEntryId = x.JournalEntryId,
                    TransactionNumber = x.TransactionNumber,
                    EntryDate = x.EntryDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    Description = x.LineDescription,
                    Debit = x.Debit,
                    Credit = x.Credit,
                    RunningBalance = x.RunningBalance
                }).ToList(),
            };
        }).OrderBy(x => x.ReferenceNumber).ToList();
    }

    private static bool IsDebitNormal(string? type) =>
        type != null && (type.Equals("Assets", StringComparison.OrdinalIgnoreCase) || type.Equals("Asset", StringComparison.OrdinalIgnoreCase) || ExpenseTypes.Contains(type, StringComparer.OrdinalIgnoreCase));

    private async Task ClearLedgerDataForPeriodAsync(Guid userId, int periodId)
    {
        await this.db.GeneralLedgerPermanentAccounts
            .Where(x => x.UserId == userId && x.PeriodId == periodId)
            .ExecuteDeleteAsync();

        await this.db.GeneralLedgerTemporaryAccounts
            .Where(x => x.UserId == userId && x.PeriodId == periodId)
            .ExecuteDeleteAsync();
    }
}
