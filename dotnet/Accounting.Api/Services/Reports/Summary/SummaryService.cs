// <copyright file="SummaryService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Services.Reports.Summary;

using System.Security.Claims;
using Accounting.Api.Data;
using Accounting.Api.DTOs;
using Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Layanan logika bisnis untuk Summary Service.
/// </summary>

public class SummaryService : ISummaryService
{
    private readonly AppDbContext context;

    /// <summary>
    /// Initializes a new instance of the <see cref="SummaryService"/> class.
    /// </summary>
    /// <param name="context">Database context.</param>
    public SummaryService(AppDbContext context)
    {
        this.context = context;
    }

    /// <summary>
    /// Mengambil data  Summary Async.
    /// </summary>

    public async Task<SummaryDto?> GetSummaryAsync(ClaimsPrincipal userPrincipal)
    {
        var userId = ResolveUserId(userPrincipal);
        if (userId == null)
        {
            return null;
        }

        var uid = userId.Value;

        // 1. Cari periode aktif
        var selectedPeriod = await this.context.Periods
            .AsNoTracking()
            .Where(p => p.UserId == uid && p.IsSelected)
            .Select(p => new
            {
                p.Id,
                p.PeriodName,
                p.StartDate,
                p.EndDate,
                p.IsClosed,
            })
            .FirstOrDefaultAsync();

        // 2. Query jurnal berdasarkan rentang periode
        var journalQuery = this.context.GeneralJournals
            .AsNoTracking()
            .Where(j => j.UserId == uid);

        if (selectedPeriod != null)
        {
            journalQuery = journalQuery.Where(j => j.EntryDate >= selectedPeriod.StartDate && j.EntryDate <= selectedPeriod.EndDate);
        }

        var journalCount = await journalQuery.Select(j => j.JournalEntryId).Distinct().CountAsync();

        // 3. Hitung COA aktif
        var activeCoaCount = await this.context.ChartOfAccounts
            .AsNoTracking()
            .CountAsync(c => c.UserId == uid && c.IsActive);

        return new SummaryDto
        {
            SelectedPeriodId = null,
            TotalJournal = journalCount,
            ActiveCoa = activeCoaCount,
            ActivePeriodName = selectedPeriod?.PeriodName ?? "Tidak Ada Periode Aktif",
            IsPeriodOpen = selectedPeriod != null && !selectedPeriod.IsClosed,
        };
    }

    private static Guid? ResolveUserId(ClaimsPrincipal userPrincipal)
    {
        var userIdClaim = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

        return !string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedGuid)
            ? parsedGuid
            : null;
    }
}
