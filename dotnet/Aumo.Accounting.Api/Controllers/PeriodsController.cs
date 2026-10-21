// <copyright file="PeriodsController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Controllers;

using System.Security.Claims;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Services.Periods;
using Aumo.Accounting.Api.Validators.Common;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Controller API untuk mengelola Periods.
/// </summary>

[ApiController]
[Route("api/periods")]
[Authorize]

public class PeriodsController : ControllerBase
{
    private readonly AppDbContext db;
    private readonly IPeriodsService periodsService;
    private readonly IValidator<CreatePeriodRequest> createPeriodValidator;
    /// <summary>
    /// Controller API untuk mengelola Periods.
    /// </summary>

    public PeriodsController(
        AppDbContext db,
        IPeriodsService periodsService,
        IValidator<CreatePeriodRequest> createPeriodValidator)
    {
        this.db = db;
        this.periodsService = periodsService;
        this.createPeriodValidator = createPeriodValidator;
    }
    /// <summary>
    /// Mengambil data  Periods.
    /// </summary>

    // ==========================================
    // 1. GET: /periods (Period List & Selection Status)
    // ==========================================
    [HttpGet]
    public async Task<IActionResult> GetPeriods()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var periodsData = await this.db.Periods
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new
            {
                p.Id,
                p.PeriodName,
                p.StartDate,
                p.EndDate,
                p.IsClosed,
                p.IsSelected,
            })
            .ToListAsync();

        var selectedPeriod = periodsData.FirstOrDefault(p => p.IsSelected);
        int? selectedPeriodId = selectedPeriod?.Id;

        // Fallback ke helper jika di DB belum ada yang bernilai IsSelected = true
        if (!selectedPeriodId.HasValue)
        {
            var selectedFromHelper = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
            selectedPeriodId = selectedFromHelper?.Id;
        }

        var periods = periodsData.Select(p => new
        {
            p.Id,
            p.PeriodName,
            p.StartDate,
            p.EndDate,
            p.IsClosed,
            IsSelected = selectedPeriodId.HasValue ? (p.Id == selectedPeriodId.Value) : p.IsSelected,
        }).ToList();

        return this.Ok(new
        {
            success = true,
            selectedPeriodId = selectedPeriodId,
            periods = periods,
        });
    }
    /// <summary>
    /// Mengambil data  Open Period Info.
    /// </summary>

    // ==========================================
    // 2. GET: /periods/open-info
    // ==========================================
    [HttpGet("open-info")]
    public async Task<IActionResult> GetOpenPeriodInfo()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var accounts = await this.db.ChartOfAccounts
            .Where(a => a.IsActive && a.UserId == userId)
            .OrderBy(a => a.ReferenceNumber)
            .ToListAsync();

        var permanentAccounts = accounts
            .Where(a => a.Type == "Assets" || a.Type == "Liabilities" || a.Type == "Equity")
            .Select(a => new { a.Id, a.ReferenceNumber, a.AccountName, a.Type, a.DisplayLabel })
            .ToList();

        var availableCashAndBank = accounts.Where(a => a.Role == "CashAndEquivalents")
            .Select(a => new { a.Id, a.ReferenceNumber, a.AccountName, a.DisplayLabel })
            .ToList();

        var availableRetainedEarnings = accounts.Where(a => a.Role == "RetainedEarnings")
            .Select(a => new { a.Id, a.ReferenceNumber, a.AccountName, a.DisplayLabel })
            .ToList();

        var hasExistingPermanentAccounts = availableCashAndBank.Count > 0 && availableRetainedEarnings.Count > 0;

        return this.Ok(new
        {
            success = true,
            hasExistingPermanentAccounts,
            availableCashAndBankAccounts = availableCashAndBank,
            availableRetainedEarningsAccounts = availableRetainedEarnings,
            permanentAccounts,
        });
    }
    /// <summary>
    /// Membuat data  Period baru.
    /// </summary>

    // ==========================================
    // 3. POST: /periods (Open New Period)
    // ==========================================
    [HttpPost]
    public async Task<IActionResult> CreatePeriod([FromBody] CreatePeriodRequest request)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var validation = await this.createPeriodValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            return this.BadRequest(validation.ToErrorResponse());
        }

        var result = await this.periodsService.CreatePeriodAsync(userId, request);

        if (result.Success)
        {
            return this.Ok(new { success = true, message = result.Message, periodId = result.PeriodId });
        }

        var body = new { success = false, message = result.Message };
        return result.IsServerError ? this.StatusCode(500, body) : this.BadRequest(body);
    }
    /// <summary>
    /// Mewakili Select Period.
    /// </summary>

    // ==========================================
    // 4. POST: /periods/select/{id} (Set Active/Viewing)
    // ==========================================
    [HttpPost("select/{id:int}")]
    public async Task<IActionResult> SelectPeriod(int id)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var entity = await this.db.Periods.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (entity == null)
        {
            return this.NotFound(new { success = false, message = "Accounting period not found." });
        }

        // TAHAP 1: Reset SEMUA IsSelected milik user ini menjadi false
        await this.db.Periods
            .Where(p => p.UserId == userId && p.IsSelected)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, false));

        // TAHAP 2: Set HANYA 1 periode yang dipilih menjadi true
        await this.db.Periods
            .Where(p => p.Id == id && p.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, true));

        // Sinkronisasi dengan helper session/cache
        await SelectedPeriodHelper.SelectPeriodAsync(this.db, userId, entity.Id);

        return this.Ok(new
        {
            success = true,
            selectedPeriodId = entity.Id,
            message = $"Now viewing {entity.PeriodName}" + (entity.IsClosed ? " (Closed)." : "."),
        });
    }
    /// <summary>
    /// Mewakili Clear Selection.
    /// </summary>

    // ==========================================
    // 5. POST: /periods/clear-selection (Stop Viewing)
    // ==========================================
    [HttpPost("clear-selection")]
    public async Task<IActionResult> ClearSelection()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        // Set semua IsSelected milik user menjadi false
        await this.db.Periods
            .Where(p => p.UserId == userId && p.IsSelected)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsSelected, false));

        await SelectedPeriodHelper.ClearSelectionAsync(this.db, userId);

        return this.Ok(new
        {
            success = true,
            message = "Period selection cleared.",
        });
    }
    /// <summary>
    /// Mewakili Close Period.
    /// </summary>

    // ==========================================
    // 6. POST: /periods/close/{id} (Close Period)
    // ==========================================
    [HttpPost("close/{id:int}")]
    public async Task<IActionResult> ClosePeriod(int id)
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var entity = await this.db.Periods.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (entity == null)
        {
            return this.NotFound(new { success = false, message = "Accounting period not found." });
        }

        if (entity.IsClosed)
        {
            return this.BadRequest(new { success = false, message = $"Period {entity.PeriodName} is already closed." });
        }

        var hasEarlierOpenPeriod = await this.db.Periods
            .AnyAsync(p => p.UserId == userId && p.Id != entity.Id && p.StartDate < entity.StartDate && !p.IsClosed);

        if (hasEarlierOpenPeriod)
        {
            return this.BadRequest(new { success = false, message = $"Cannot close {entity.PeriodName}: an earlier period is still open. Close earlier periods first." });
        }

        entity.IsClosed = true;
        await this.db.SaveChangesAsync();

        return this.Ok(new
        {
            success = true,
            message = $"Period {entity.PeriodName} has been closed. Transactions in this period are now locked.",
        });
    }

    private Guid GetCurrentUserId()
    {
        var userIdStr = this.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? this.User.FindFirstValue("sub");

        return Guid.TryParse(userIdStr, out Guid userId) ? userId : Guid.Empty;
    }
}
