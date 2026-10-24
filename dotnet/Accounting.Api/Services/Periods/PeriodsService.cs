using System.Globalization;
using Accounting.Api.Data;
using Accounting.Api.DTOs;
using Accounting.Api.Helpers;
using Accounting.Api.Models;
using Accounting.Api.Services.Reports.GeneralLedgers;
using Accounting.Api.Services.Reports.Journals;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Api.Services.Periods;

public class PeriodsService : IPeriodsService
{
    private readonly AppDbContext db;
    private readonly ITransactionNumberService txNumberService;
    private readonly IGeneralLedgersService glService;

    public PeriodsService(AppDbContext db, ITransactionNumberService txNumberService, IGeneralLedgersService glService)
    {
        this.db = db;
        this.txNumberService = txNumberService;
        this.glService = glService;
    }

    public async Task<GetPeriodsResponse> GetPeriodsAsync(Guid userId)
    {
        var periodsData = await this.db.Periods
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new PeriodDto
            {
                Id = p.Id,
                PeriodName = p.PeriodName,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                IsClosed = p.IsClosed,
                IsSelected = p.IsSelected,
            })
            .ToListAsync();

        var selectedPeriod = periodsData.FirstOrDefault(p => p.IsSelected);
        int? selectedPeriodId = selectedPeriod?.Id;

        if (!selectedPeriodId.HasValue)
        {
            var selectedFromHelper = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
            selectedPeriodId = selectedFromHelper?.Id;
        }

        var periods = periodsData.Select(p => new PeriodDto
        {
            Id = p.Id,
            PeriodName = p.PeriodName,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            IsClosed = p.IsClosed,
            IsSelected = selectedPeriodId.HasValue ? (p.Id == selectedPeriodId.Value) : p.IsSelected,
        }).ToList();

        return new GetPeriodsResponse
        {
            Success = true,
            SelectedPeriodId = selectedPeriodId,
            Periods = periods,
        };
    }

    public async Task<OpenPeriodInfoResponse> GetOpenPeriodInfoAsync(Guid userId)
    {
        var accounts = await this.db.ChartOfAccounts
            .Where(a => a.IsActive && a.UserId == userId)
            .OrderBy(a => a.ReferenceNumber)
            .ToListAsync();

        var permanentAccounts = accounts
            .Where(a => a.Type == "Assets" || a.Type == "Liabilities" || a.Type == "Equity")
            .Select(a => new AccountSimpleDto
            {
                Id = a.Id,
                ReferenceNumber = a.ReferenceNumber,
                AccountName = a.AccountName,
                Type = a.Type,
                DisplayLabel = a.DisplayLabel,
            })
            .ToList();

        var availableCashAndBank = accounts.Where(a => a.Role == "CashAndEquivalents")
            .Select(a => new AccountSimpleDto
            {
                Id = a.Id,
                ReferenceNumber = a.ReferenceNumber,
                AccountName = a.AccountName,
                Type = a.Type,
                DisplayLabel = a.DisplayLabel,
            })
            .ToList();

        var availableRetainedEarnings = accounts.Where(a => a.Role == "RetainedEarnings")
            .Select(a => new AccountSimpleDto
            {
                Id = a.Id,
                ReferenceNumber = a.ReferenceNumber,
                AccountName = a.AccountName,
                Type = a.Type,
                DisplayLabel = a.DisplayLabel,
            })
            .ToList();

        var hasExistingPermanentAccounts = availableCashAndBank.Count > 0 && availableRetainedEarnings.Count > 0;

        return new OpenPeriodInfoResponse
        {
            Success = true,
            HasExistingPermanentAccounts = hasExistingPermanentAccounts,
            AvailableCashAndBankAccounts = availableCashAndBank,
            AvailableRetainedEarningsAccounts = availableRetainedEarnings,
            PermanentAccounts = permanentAccounts,
        };
    }

    /// <summary>
    /// Membuat data Period Async baru.
    /// </summary>
    public async Task<CreatePeriodResult> CreatePeriodAsync(Guid userId, CreatePeriodRequest request)
    {
        var startDate = DateTime.SpecifyKind(new DateTime(request.Year, request.Month, 1), DateTimeKind.Utc);
        var endDate = startDate.AddMonths(1).AddDays(-1);
        var periodName = startDate.ToString("MMMM yyyy", CultureInfo.InvariantCulture);
        var isLoadExisting = request.SetupMode == CreatePeriodRequest.ModeLoadExisting;

        var strategy = this.db.Database.CreateExecutionStrategy();

        try
        {
            return await strategy.ExecuteAsync(async () =>
            {
                this.db.ChangeTracker.Clear();

                await using var transaction = await this.db.Database.BeginTransactionAsync();

                var periodExists = await this.db.Periods.AnyAsync(p => p.UserId == userId && p.StartDate == startDate);
                if (periodExists)
                {
                    return Fail($"Period {periodName} already exists.");
                }

                if (isLoadExisting)
                {
                    var cashAccount = await this.db.ChartOfAccounts.FirstOrDefaultAsync(a => a.Id == request.CashAccountId && a.UserId == userId);
                    var bankAccount = await this.db.ChartOfAccounts.FirstOrDefaultAsync(a => a.Id == request.BankAccountId && a.UserId == userId);
                    var retainedAccount = await this.db.ChartOfAccounts.FirstOrDefaultAsync(a => a.Id == request.RetainedEarningsAccountId && a.UserId == userId);

                    if (cashAccount == null || bankAccount == null || retainedAccount == null)
                    {
                        return Fail("One or more selected accounts could not be found.");
                    }

                    if (retainedAccount.Role != "RetainedEarnings")
                    {
                        return Fail("The selected Retained Earnings account is not a Retained Earnings account.");
                    }

                    var newPeriod = new Period
                    {
                        UserId = userId,
                        PeriodName = periodName,
                        StartDate = startDate,
                        EndDate = endDate,
                        IsClosed = false,
                        IsSelected = false,
                    };
                    this.db.Periods.Add(newPeriod);
                    await this.db.SaveChangesAsync();

                    var opening = await this.AddOpeningBalanceJournalAsync(userId, startDate, retainedAccount);
                    if (opening.Error != null)
                    {
                        return Fail(opening.Error);
                    }

                    await transaction.CommitAsync();

                    var carryInfo = opening.AccountCount > 0
                        ? $" Saldo Awal journal created for {opening.AccountCount} permanent accounts."
                        : " No previous period balances to carry forward.";

                    return new CreatePeriodResult
                    {
                        Success = true,
                        Message = $"Period {newPeriod.PeriodName} has been opened successfully.{carryInfo}",
                        PeriodId = newPeriod.Id,
                    };
                }
                else
                {
                    if (!int.TryParse(request.CashAccountCode, out var cashCode)
                        || !int.TryParse(request.BankAccountCode, out var bankCode)
                        || !int.TryParse(request.RetainedEarningsAccountCode, out var retainedCode))
                    {
                        return Fail("Account reference codes must be numeric.");
                    }

                    if (cashCode == bankCode || cashCode == retainedCode || bankCode == retainedCode)
                    {
                        return Fail("Cash, Bank, and Retained Earnings accounts must use different reference numbers.");
                    }

                    var codeInUse = await this.db.ChartOfAccounts.AnyAsync(a => a.UserId == userId
                        && (a.ReferenceNumber == cashCode || a.ReferenceNumber == bankCode || a.ReferenceNumber == retainedCode));
                    if (codeInUse)
                    {
                        return Fail("One or more account reference numbers are already in use in your Chart of Accounts.");
                    }

                    var cashAccount = new ChartOfAccount { UserId = userId, ReferenceNumber = cashCode, AccountName = request.CashAccountName!.Trim(), Type = "Assets", Role = "CashAndEquivalents", IsActive = true };
                    var bankAccount = new ChartOfAccount { UserId = userId, ReferenceNumber = bankCode, AccountName = request.BankAccountName!.Trim(), Type = "Assets", Role = "CashAndEquivalents", IsActive = true };
                    var retainedAccount = new ChartOfAccount { UserId = userId, ReferenceNumber = retainedCode, AccountName = request.RetainedEarningsAccountName!.Trim(), Type = "Equity", Role = "RetainedEarnings", IsActive = true };

                    this.db.ChartOfAccounts.AddRange(cashAccount, bankAccount, retainedAccount);

                    var newPeriod = new Period
                    {
                        UserId = userId,
                        PeriodName = periodName,
                        StartDate = startDate,
                        EndDate = endDate,
                        IsClosed = false,
                        IsSelected = false,
                    };
                    this.db.Periods.Add(newPeriod);
                    await this.db.SaveChangesAsync();

                    var cashBalance = request.CashBalance ?? 0;
                    var bankBalance = request.BankBalance ?? 0;
                    var totalOpeningBalance = cashBalance + bankBalance;

                    if (totalOpeningBalance != 0)
                    {
                        var transactionNumber = await this.txNumberService.GenerateAsync(userId, "General", startDate);

                        var openingLines = new List<GeneralJournalWriter.Line>();
                        if (cashBalance != 0)
                        {
                            openingLines.Add(new GeneralJournalWriter.Line(cashAccount.Id, "Saldo Awal", cashBalance, 0));
                        }

                        if (bankBalance != 0)
                        {
                            openingLines.Add(new GeneralJournalWriter.Line(bankAccount.Id, "Saldo Awal", bankBalance, 0));
                        }

                        openingLines.Add(new GeneralJournalWriter.Line(retainedAccount.Id, "Saldo Awal", 0, totalOpeningBalance));

                        int journalEntryId = await GeneralJournalWriter.NextJournalEntryIdAsync(this.db);
                        this.db.GeneralJournals.AddRange(GeneralJournalWriter.BuildRows(
                            journalEntryId, userId, transactionNumber, "General",
                            startDate, DateTime.UtcNow, null, openingLines));
                        await this.db.SaveChangesAsync();
                    }

                    await transaction.CommitAsync();

                    return new CreatePeriodResult
                    {
                        Success = true,
                        Message = $"Period {newPeriod.PeriodName} has been opened successfully.",
                        PeriodId = newPeriod.Id,
                    };
                }
            });
        }
        catch (Exception ex)
        {
            return new CreatePeriodResult
            {
                Success = false,
                IsServerError = true,
                Message = $"Failed to open period: {ex.InnerException?.Message ?? ex.Message}",
            };
        }

        static CreatePeriodResult Fail(string message) => new() { Success = false, Message = message };
    }

    private static readonly string[] PermanentTypes = { "Assets", "Liabilities", "Equity" };
    private static readonly string[] TemporaryTypes = { "OperatingIncome", "OtherIncome", "OperatingExpenses", "OtherExpenses" };

    private sealed record OpeningResult(int AccountCount, string? Error);

    private async Task<OpeningResult> AddOpeningBalanceJournalAsync(Guid userId, DateTime startDate, ChartOfAccount retainedAccount)
    {
        var previous = await this.db.Periods
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.StartDate < startDate)
            .OrderByDescending(p => p.StartDate)
            .FirstOrDefaultAsync();

        if (previous == null)
        {
            return new OpeningResult(0, null);
        }

        var prevStart = DateTime.SpecifyKind(previous.StartDate.Date, DateTimeKind.Utc);
        var prevEnd = DateTime.SpecifyKind(previous.EndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        if (!PermanentTypes.Contains(retainedAccount.Type))
        {
            return new OpeningResult(0, "The selected Retained Earnings account must be an Equity account.");
        }

        var accounts = await this.db.ChartOfAccounts
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.IsActive)
            .ToListAsync();

        if (accounts.All(a => a.Id != retainedAccount.Id))
        {
            accounts.Add(retainedAccount);
        }

        var totals = await this.db.GeneralJournals
            .AsNoTracking()
            .Where(l => l.UserId == userId
                     && (l.JournalType == "General" || l.JournalType == "Adjusting")
                     && l.EntryDate >= prevStart
                     && l.EntryDate <= prevEnd)
            .GroupBy(l => l.AccountId)
            .Select(g => new { AccountId = g.Key, Debit = g.Sum(x => x.Debit), Credit = g.Sum(x => x.Credit) })
            .ToDictionaryAsync(x => x.AccountId);

        decimal Signed(ChartOfAccount a) =>
            totals.TryGetValue(a.Id, out var t) ? t.Debit - t.Credit : 0m;

        decimal netIncome = accounts
            .Where(a => TemporaryTypes.Contains(a.Type))
            .Sum(a => -Signed(a));

        var balances = new List<(ChartOfAccount Account, decimal Signed)>();
        foreach (var account in accounts.Where(a => PermanentTypes.Contains(a.Type)).OrderBy(a => a.ReferenceNumber))
        {
            var balance = Signed(account);
            if (account.Id == retainedAccount.Id)
            {
                balance -= netIncome;
            }

            balance = Math.Round(balance, 2);
            if (balance != 0m)
            {
                balances.Add((account, balance));
            }
        }

        if (balances.Count == 0)
        {
            return new OpeningResult(0, null);
        }

        var totalDebit = balances.Where(b => b.Signed > 0).Sum(b => b.Signed);
        var totalCredit = balances.Where(b => b.Signed < 0).Sum(b => -b.Signed);
        if (Math.Round(totalDebit - totalCredit, 2) != 0m)
        {
            return new OpeningResult(
                0,
                $"Saldo Awal is not balanced (debit {totalDebit:N2} vs credit {totalCredit:N2}). Check the journals of {previous.PeriodName}.");
        }

        var transactionNumber = await this.txNumberService.GenerateAsync(userId, "General", startDate);

        var openingLines = balances.Select(b => new GeneralJournalWriter.Line(
            b.Account.Id,
            "Saldo Awal",
            b.Signed > 0 ? b.Signed : 0m,
            b.Signed < 0 ? -b.Signed : 0m)).ToList();
        int journalEntryId = await GeneralJournalWriter.NextJournalEntryIdAsync(this.db);
        this.db.GeneralJournals.AddRange(GeneralJournalWriter.BuildRows(
            journalEntryId, userId, transactionNumber, "General",
            startDate, DateTime.UtcNow, null, openingLines));
        await this.db.SaveChangesAsync();

        return new OpeningResult(balances.Count, null);
    }

    /// <summary>
    /// Mewakili Select Period Async.
    /// </summary>
    public async Task<SelectPeriodResult?> SelectPeriodAsync(Guid userId, int periodId)
    {
        var entity = await this.db.Periods.FirstOrDefaultAsync(p => p.Id == periodId && p.UserId == userId);
        if (entity == null)
        {
            return null;
        }

        await this.db.Periods
            .Where(p => p.UserId == userId && p.IsSelected)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, false));

        await this.db.Periods
            .Where(p => p.Id == periodId && p.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, true));

        await SelectedPeriodHelper.SelectPeriodAsync(this.db, userId, entity.Id);

        // Regenerasikan data staging General Ledgers untuk periode terpilih
        await this.glService.RefreshGeneralLedgersAsync(userId);

        return new SelectPeriodResult
        {
            Success = true,
            SelectedPeriodId = entity.Id,
            Message = $"Now viewing {entity.PeriodName}" + (entity.IsClosed ? " (Closed)." : "."),
        };
    }

    /// <summary>
    /// Mewakili Clear Selection Async.
    /// </summary>
    public async Task<BaseServiceResult> ClearSelectionAsync(Guid userId)
    {
        // Bersihkan staging table sebelum menghilangkan penanda pilihan
        await this.glService.ClearSelectedPeriodLedgersAsync(userId);

        await this.db.Periods
            .Where(p => p.UserId == userId && p.IsSelected)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, false));

        await SelectedPeriodHelper.ClearSelectionAsync(this.db, userId);

        return new BaseServiceResult
        {
            Success = true,
            Message = "Period selection cleared.",
        };
    }

    /// <summary>
    /// Mewakili Close Period Async.
    /// </summary>
    public async Task<BaseServiceResult> ClosePeriodAsync(Guid userId, int periodId)
    {
        var entity = await this.db.Periods.FirstOrDefaultAsync(p => p.Id == periodId && p.UserId == userId);
        if (entity == null)
        {
            return new BaseServiceResult
            {
                Success = false,
                Message = "Accounting period not found.",
            };
        }

        if (entity.IsClosed)
        {
            return new BaseServiceResult
            {
                Success = false,
                Message = $"Period {entity.PeriodName} is already closed.",
            };
        }

        var hasEarlierOpenPeriod = await this.db.Periods
            .AnyAsync(p => p.UserId == userId && p.Id != entity.Id && p.StartDate < entity.StartDate && !p.IsClosed);

        if (hasEarlierOpenPeriod)
        {
            return new BaseServiceResult
            {
                Success = false,
                Message = $"Cannot close {entity.PeriodName}: an earlier period is still open. Close earlier periods first.",
            };
        }

        entity.IsClosed = true;
        await this.db.SaveChangesAsync();

        return new BaseServiceResult
        {
            Success = true,
            Message = $"Period {entity.PeriodName} has been closed. Transactions in this period are now locked.",
        };
    }
}
