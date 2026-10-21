#pragma warning disable CA1862
#pragma warning disable CA1304
#pragma warning disable CA1311
using System.Globalization;
// <copyright file="ChartOfAccountsController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Controllers;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;
using Aumo.Accounting.Api.Services;


using Aumo.Accounting.Api.Validators.Common;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Controller API untuk mengelola Chart Of Accounts.
/// </summary>

[ApiController]
[Route("api/chart-of-accounts")]
[Authorize]


public class ChartOfAccountsController : ControllerBase
{
    private readonly AppDbContext db;
    private readonly IValidator<CreateAccountRequest> createAccountValidator;
    private readonly IValidator<UpdateAccountRequest> updateAccountValidator;
    private readonly IValidator<GetAccountsQuery> getAccountsValidator;
    /// <summary>
    /// Controller API untuk mengelola Chart Of Accounts.
    /// </summary>

    public ChartOfAccountsController(
        AppDbContext db,
        IValidator<CreateAccountRequest> createAccountValidator,
        IValidator<UpdateAccountRequest> updateAccountValidator,
        IValidator<GetAccountsQuery> getAccountsValidator)
    {
        this.db = db;
        this.createAccountValidator = createAccountValidator;
        this.updateAccountValidator = updateAccountValidator;
        this.getAccountsValidator = getAccountsValidator;
    }
    /// <summary>
    /// Mengambil data  Accounts.
    /// </summary>

    // ==========================================
    // 1. GET: /chart-of-accounts
    // ==========================================
    [HttpGet]
    public async Task<IActionResult> GetAccounts([FromQuery] GetAccountsQuery filter)
    {
        var validation = await this.getAccountsValidator.ValidateAsync(filter);
        if (!validation.IsValid)
        {
            return this.BadRequest(validation.ToErrorResponse());
        }

        var search = filter.Search;
        var category = filter.Category;

        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var query = this.db.ChartOfAccounts.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(a => a.AccountName.ToLower(System.Globalization.CultureInfo.InvariantCulture).Contains(keyword)
                                  || a.ReferenceNumber.ToString(System.Globalization.CultureInfo.InvariantCulture).Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Type == category);
        }

        var loadedAccounts = await query
            .OrderBy(a => a.ReferenceNumber)
            .ToListAsync();

        var accountIds = loadedAccounts.Select(a => a.Id).ToList();

        var currentPeriod = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId)
            ?? await this.db.Periods
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

            var accountBalances = await this.db.GeneralJournals
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
                    account.Balance = AccountClassificationHelper.NormalBalanceIsDebit(account.Type)
                        ? balance.TotalDebit - balance.TotalCredit
                        : balance.TotalCredit - balance.TotalDebit;
                }
                else
                {
                    account.Balance = 0;
                }
            }
        }

        var result = loadedAccounts.Select(a => new
        {
            a.Id,
            a.ReferenceNumber,
            a.AccountName,
            a.Type,
            a.Role,
            a.IsActive,
            a.Balance,
        });

        return this.Ok(new
        {
            success = true,
            selectedPeriodName = currentPeriod?.PeriodName,
            accounts = result,
        });
    }
    /// <summary>
    /// Membuat data  Account baru.
    /// </summary>

    // ==========================================
    // 2. POST: /chart-of-accounts
    // ==========================================
    [HttpPost]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var validation = await this.createAccountValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            return this.BadRequest(validation.ToErrorResponse());
        }

        bool isCodeTaken = await this.db.ChartOfAccounts
            .AnyAsync(a => a.UserId == userId && a.ReferenceNumber == request.ReferenceNumber);

        if (isCodeTaken)
        {
            return this.BadRequest(new { success = false, message = $"Account code {request.ReferenceNumber} is already in use." });
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
            this.db.ChartOfAccounts.Add(newAccount);
            await this.db.SaveChangesAsync();

            return this.Ok(new
            {
                success = true,
                message = $"Account '{newAccount.AccountName}' successfully created.",
                accountId = newAccount.Id,
            });
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { success = false, message = $"A fatal error occurred while saving the account: {ex.Message}" });
        }
    }
    /// <summary>
    /// Memperbarui data  Account.
    /// </summary>

    // ==========================================
    // 3. PUT: /chart-of-accounts/{id}
    // ==========================================
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAccount(int id, [FromBody] UpdateAccountRequest request)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var validation = await this.updateAccountValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            return this.BadRequest(validation.ToErrorResponse());
        }

        var account = await this.db.ChartOfAccounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (account == null)
        {
            return this.NotFound(new { success = false, message = "Account not found." });
        }

        bool isCodeTaken = await this.db.ChartOfAccounts
            .AnyAsync(a => a.UserId == userId && a.ReferenceNumber == request.ReferenceNumber && a.Id != id);

        if (isCodeTaken)
        {
            return this.BadRequest(new { success = false, message = $"Account code {request.ReferenceNumber} is already in use." });
        }

        account.ReferenceNumber = request.ReferenceNumber;
        account.AccountName = request.AccountName.Trim();
        account.Type = request.Type;
        account.Role = string.IsNullOrWhiteSpace(request.Role) ? "Default" : request.Role;
        account.IsActive = request.IsActive;

        try
        {
            await this.db.SaveChangesAsync();

            return this.Ok(new
            {
                success = true,
                message = $"Account '{account.AccountName}' successfully updated.",
            });
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { success = false, message = $"A fatal error occurred while updating the account: {ex.Message}" });
        }
    }
    /// <summary>
    /// Menghapus data  Account.
    /// </summary>

    // ==========================================
    // 4. DELETE: /chart-of-accounts/{id}
    // ==========================================
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAccount(int id)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var entity = await this.db.ChartOfAccounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (entity == null)
        {
            return this.NotFound(new { success = false, message = "Account not found." });
        }

        bool hasJournalLines = await this.db.GeneralJournals.AnyAsync(l => l.AccountId == id);
        if (hasJournalLines)
        {
            return this.BadRequest(new { success = false, message = $"Account '{entity.AccountName}' cannot be deleted because it already has journal entries. Set it to Inactive instead." });
        }

        try
        {
            this.db.ChartOfAccounts.Remove(entity);
            await this.db.SaveChangesAsync();

            return this.Ok(new
            {
                success = true,
                message = $"Account '{entity.AccountName}' successfully deleted.",
            });
        }
        catch (Exception ex)
        {
            return this.StatusCode(500, new { success = false, message = $"A fatal error occurred while deleting the account: {ex.Message}" });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdStr = this.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? this.User.FindFirstValue("sub");

        return Guid.TryParse(userIdStr, out Guid userId) ? userId : Guid.Empty;
    }
}
