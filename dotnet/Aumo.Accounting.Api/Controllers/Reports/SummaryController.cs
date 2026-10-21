// <copyright file="SummaryController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Controllers;

using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;
using Aumo.Accounting.Api.Services;


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Controller API untuk mengelola Summary.
/// </summary>

[ApiController]
[Route("reports/[controller]")]
[Authorize]


public class SummaryController : ControllerBase
{
    private readonly AppDbContext context;
    /// <summary>
    /// Controller API untuk mengelola Summary.
    /// </summary>

    public SummaryController(AppDbContext context)
    {
        this.context = context;
    }
    /// <summary>
    /// Mengambil data  Summary.
    /// </summary>

    [HttpGet]
    public async Task<IActionResult> GetSummary()
    {
        var userIdClaim = this.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return this.Unauthorized(new { success = false, message = "User session expired or invalid." });
        }

        // 1. Cari periode yang sedang dipilih oleh user (IsSelected == true)
        var selectedPeriod = await this.context.Periods
           .AsNoTracking()
           .Where(p => p.UserId == userId && p.IsSelected)
           .Select(p => new
           {
               p.Id,
               p.PeriodName,
               p.StartDate,
               p.EndDate,
               p.IsClosed,
           })
           .FirstOrDefaultAsync();

        // 2. Query GeneralJournal filtered berdasarkan rentang tanggal periode yang dipilih (jika ada)
        var journalQuery = this.context.GeneralJournals
           .AsNoTracking()
           .Where(j => j.UserId == userId);

        if (selectedPeriod != null)
        {
            journalQuery = journalQuery.Where(j => j.EntryDate >= selectedPeriod.StartDate && j.EntryDate <= selectedPeriod.EndDate);
        }

        var journalCount = await journalQuery.Select(j => j.JournalEntryId).Distinct().CountAsync();

        // 3. Hitung Active COA
        var activeCoaCount = await this.context.ChartOfAccounts
           .AsNoTracking()
           .CountAsync(c => c.UserId == userId && c.IsActive);

        var activePeriodName = selectedPeriod?.PeriodName ?? "Tidak Ada Periode Aktif";
        var isPeriodOpen = selectedPeriod != null && !selectedPeriod.IsClosed;

        var summaryData = new
        {
            selectedPeriodId = selectedPeriod?.Id,
            totalJournal = journalCount,
            activeCoa = activeCoaCount,
            activePeriodName = activePeriodName,
            isPeriodOpen = isPeriodOpen,
        };

        return this.Ok(new
        {
            success = true,
            data = summaryData,
            totalJournal = journalCount,
            activeCoa = activeCoaCount,
            activePeriodName = summaryData.activePeriodName,
            isPeriodOpen = summaryData.isPeriodOpen,
        });
    }
}
