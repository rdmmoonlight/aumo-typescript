// <copyright file="ChartOfAccountsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.ChartOfAccounts;

using System.Globalization;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Layanan logika bisnis untuk Chart Of Accounts Service.
/// </summary>
public class ChartOfAccountsService(AppDbContext db) : IChartOfAccountsService
{
    /// <summary>
    /// Mengambil data Accounts Async.
    /// </summary>
    public async Task<ChartOfAccountsListResponseDto> GetAccountsAsync(Guid userId, string? search, string? category)
    {
        var query = db.ChartOfAccounts.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(a => a.AccountName.ToLower(CultureInfo.InvariantCulture).Contains(keyword)
                                  || a.ReferenceNumber.ToString(CultureInfo.InvariantCulture).Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Type == category);
        }

        var loadedAccounts = await query
            .OrderBy(a => a.ReferenceNumber)
            .ToListAsync();

        var accountIds = loadedAccounts.Select(a => a.Id).ToList();
        var currentPeriod = await SelectedPeriodHelper.GetSelectedPeriodAsync(db, userId)
            ?? await db.Periods
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.StartDate)
                .FirstOrDefaultAsync();

        if (currentPeriod == null)
        {
            foreach (var account in loadedAccounts)
            {
                account.Balance = 0;
            }
        }
        else
        {
            var startUtc = DateTime.SpecifyKind(currentPeriod.StartDate.Date, DateTimeKind.Utc);
            var endUtc = DateTime.SpecifyKind(currentPeriod.EndDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var accountBalances = await db.GeneralJournals
                .Where(j => accountIds.Contains(j.AccountId) &&
                            j.UserId == userId &&
                            (j.JournalType == "General" || j.JournalType == "Adjusting") &&
                            j.EntryDate >= startUtc &&
                            j.EntryDate <= endUtc)
                .GroupBy(j => j.AccountId)
                .Select(g => new
                {
                    AccountId = g.Key,
                    TotalDebit = g.Sum(j => j.Debit),
                    TotalCredit = g.Sum(j => j.Credit),
                })
                .ToDictionaryAsync(x => x.AccountId);

            foreach (var account in loadedAccounts)
            {
                if (accountBalances.TryGetValue(account.Id, out var balance))
                {
                    if (Enum.TryParse<AccountClassification>(account.Type.ToString(), true, out var classification))
                    {
                        account.Balance = AccountClassificationHelper.NormalBalanceIsDebit(classification)
                            ? balance.TotalDebit - balance.TotalCredit
                            : balance.TotalCredit - balance.TotalDebit;
                    }
                    else
                    {
                        account.Balance = balance.TotalDebit - balance.TotalCredit;
                    }
                }
                else
                {
                    account.Balance = 0;
                }
            }
        }

        var accountsList = loadedAccounts.Select(a => new AccountItemDto
        {
            Id = a.Id,
            ReferenceNumber = a.ReferenceNumber,
            AccountName = a.AccountName,
            Type = a.Type,
            Role = a.Role,
            IsActive = a.IsActive,
            Balance = a.Balance,
        });

        return new ChartOfAccountsListResponseDto
        {
            Success = true,
            SelectedPeriodName = currentPeriod?.PeriodName,
            Accounts = accountsList,
        };
    }

    /// <summary>
    /// Membuat data Account Async baru.
    /// </summary>
    public async Task<ServiceResultDto> CreateAccountAsync(Guid userId, CreateAccountRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.AccountName))
        {
            return Fail("Account name is required.", 400);
        }

        if (string.IsNullOrWhiteSpace(request.Type))
        {
            return Fail("Account category type is required.", 400);
        }

        if (!Enum.TryParse<AccountClassification>(request.Type.ToString(), true, out var classification))
        {
            return Fail($"Invalid account classification category '{request.Type}'.", 400);
        }

        if (!AccountClassificationHelper.ValidateReferenceNumber(classification.ToString()))
        {
            return Fail($"Invalid reference number {request.ReferenceNumber} for category {request.Type}.", 400);
        }

        bool isCodeTaken = await db.ChartOfAccounts
            .AnyAsync(a => a.UserId == userId && a.ReferenceNumber == request.ReferenceNumber);

        if (isCodeTaken)
        {
            return Fail($"Account code {request.ReferenceNumber} is already in use.", 400);
        }

        var newAccount = new ChartOfAccount
        {
            UserId = userId,
            ReferenceNumber = request.ReferenceNumber,
            AccountName = request.AccountName.Trim(),
            Type = request.Type,
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Default" : request.Role,
            IsActive = true,
            Balance = 0,
        };

        try
        {
            db.ChartOfAccounts.Add(newAccount);
            await db.SaveChangesAsync();

            return new ServiceResultDto
            {
                IsSuccess = true,
                Message = $"Account '{newAccount.AccountName}' successfully created.",
                AccountId = newAccount.Id,
                StatusCode = 200,
            };
        }
        catch (Exception ex)
        {
            return Fail($"A fatal error occurred while saving the account: {ex.Message}", 500);
        }
    }

    /// <summary>
    /// Memperbarui data Account Async.
    /// </summary>
    public async Task<ServiceResultDto> UpdateAccountAsync(Guid userId, int accountId, UpdateAccountRequestDto request)
    {
        var account = await db.ChartOfAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (account == null)
        {
            return Fail("Account not found.", 404);
        }

        if (string.IsNullOrWhiteSpace(request.AccountName))
        {
            return Fail("Account name is required.", 400);
        }

        if (!Enum.TryParse<AccountClassification>(request.Type.ToString(), true, out var classification))
        {
            return Fail($"Invalid account classification category '{request.Type}'.", 400);
        }

        if (!AccountClassificationHelper.ValidateReferenceNumber(classification.ToString()))
        {
            return Fail($"Invalid reference number {request.ReferenceNumber} for category {request.Type}.", 400);
        }

        bool isCodeTaken = await db.ChartOfAccounts
            .AnyAsync(a => a.UserId == userId && a.ReferenceNumber == request.ReferenceNumber && a.Id != accountId);

        if (isCodeTaken)
        {
            return Fail($"Account code {request.ReferenceNumber} is already in use.", 400);
        }

        account.ReferenceNumber = request.ReferenceNumber;
        account.AccountName = request.AccountName.Trim();
        account.Type = request.Type;
        account.Role = string.IsNullOrWhiteSpace(request.Role) ? "Default" : request.Role;
        account.IsActive = request.IsActive;

        try
        {
            await db.SaveChangesAsync();
            return Success($"Account '{account.AccountName}' successfully updated.");
        }
        catch (Exception ex)
        {
            return Fail($"A fatal error occurred while updating the account: {ex.Message}", 500);
        }
    }

    /// <summary>
    /// Menghapus data Account Async.
    /// </summary>
    public async Task<ServiceResultDto> DeleteAccountAsync(Guid userId, int accountId)
    {
        var entity = await db.ChartOfAccounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

        if (entity == null)
        {
            return Fail("Account not found.", 404);
        }

        bool hasJournalLines = await db.GeneralJournals.AnyAsync(l => l.AccountId == accountId);
        if (hasJournalLines)
        {
            return Fail($"Account '{entity.AccountName}' cannot be deleted because it already has journal entries. Set it to Inactive instead.", 400);
        }

        try
        {
            db.ChartOfAccounts.Remove(entity);
            await db.SaveChangesAsync();
            return Success($"Account '{entity.AccountName}' successfully deleted.");
        }
        catch (Exception ex)
        {
            return Fail($"A fatal error occurred while deleting the account: {ex.Message}", 500);
        }
    }

    private static ServiceResultDto Success(string message) =>
        new() { IsSuccess = true, Message = message, StatusCode = 200 };

    private static ServiceResultDto Fail(string message, int statusCode) =>
        new() { IsSuccess = false, Message = message, StatusCode = statusCode };
}
