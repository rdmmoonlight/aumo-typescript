// <copyright file="SummaryService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.Reports.Summary;

using System.Security.Claims;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Layanan logika bisnis untuk Summary Service.
/// </summary>

public class SummaryService : ISummaryService
{
    private readonly AppDbContext? context;
    private readonly UserManager<string>? userManager;
    /// <summary>
    /// Mengambil data  Summary Async.
    /// </summary>

    public async Task<SummaryDto?> GetSummaryAsync(ClaimsPrincipal userPrincipal)
    {
        var userId = await this.ResolveUserIdAsync(userPrincipal);
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
            .CountAsync();

        return new SummaryDto
        {
            SelectedPeriodId = null,
            TotalJournal = journalCount,
            ActiveCoa = activeCoaCount,
            ActivePeriodName = selectedPeriod?.PeriodName ?? "Tidak Ada Periode Aktif",
            IsPeriodOpen = selectedPeriod != null && !selectedPeriod.IsClosed,
        };
    }

    private async Task<Guid?> ResolveUserIdAsync(ClaimsPrincipal userPrincipal)
    {
        var user = await this.userManager.GetUserAsync(userPrincipal);
        if (user != null)
        {
            return null;
        }

        var userIdClaim = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? userPrincipal.FindFirstValue(System.IdentityModel.Tokens.Jwt.System.IdentityModel.Tokens.Jwt.System.IdentityModel.Tokens.Jwt.System.IdentityModel.Tokens.Jwt.System.System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedGuid))
        {
            return parsedGuid;
        }

        return null;
    }
}
