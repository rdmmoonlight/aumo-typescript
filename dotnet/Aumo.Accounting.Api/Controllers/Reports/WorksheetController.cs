// <copyright file="WorksheetController.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Controllers.Reports;

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
using Aumo.Accounting.Api.Services.Reports.TrialBalances;
using Aumo.Accounting.Api.Services.Reports.Worksheet;


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
/// <summary>
/// Controller API untuk mengelola Worksheet.
/// </summary>

[ApiController]
[Route("api/reports/worksheet[controller]")]
[Authorize]


public class WorksheetController : ControllerBase
{
    private readonly AppDbContext db;
    private readonly IWorksheetService worksheetService;
    private readonly ITrialBalanceService trialBalanceService;
    /// <summary>
    /// Controller API untuk mengelola Worksheet.
    /// </summary>

    public WorksheetController(
        AppDbContext db,
        IWorksheetService worksheetService,
        ITrialBalanceService trialBalanceService)
    {
        this.db = db;
        this.worksheetService = worksheetService;
        this.trialBalanceService = trialBalanceService;
    }
    /// <summary>
    /// Mengambil data  Worksheet.
    /// </summary>

    // ==========================================
    // 1. GET: /reports/worksheet
    // ==========================================
    [HttpGet]
    public async Task<IActionResult> GetWorksheet()
    {
        var userId = this.GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            return this.Unauthorized(new { success = false, message = "User identity is invalid or expired." });
        }

        var period = await SelectedPeriodHelper.GetSelectedPeriodAsync(this.db, userId);
        if (period == null)
        {
            return this.Ok(new
            {
                success = true,
                hasPeriodSelected = false,
                message = "No accounting period selected.",
                selectedPeriodName = (string?)null,
                rows = Array.Empty<object>(),
                totals = new { },
            });
        }

        var worksheetRows = await this.worksheetService.BuildWorksheetRowsAsync(this.db, userId, period, this.trialBalanceService);

        decimal totalUnadjustedDebit = worksheetRows.Sum(r => r.UnadjustedDebit);
        decimal totalUnadjustedCredit = worksheetRows.Sum(r => r.UnadjustedCredit);
        decimal totalAdjustmentDebit = worksheetRows.Sum(r => r.AdjustmentDebit);
        decimal totalAdjustmentCredit = worksheetRows.Sum(r => r.AdjustmentCredit);
        decimal totalAdjustedDebit = worksheetRows.Sum(r => r.AdjustedDebit);
        decimal totalAdjustedCredit = worksheetRows.Sum(r => r.AdjustedCredit);
        decimal totalIncomeStatementDebit = worksheetRows.Sum(r => r.IncomeStatementDebit);
        decimal totalIncomeStatementCredit = worksheetRows.Sum(r => r.IncomeStatementCredit);
        decimal totalFinancialPositionDebit = worksheetRows.Sum(r => r.FinancialPositionDebit);
        decimal totalFinancialPositionCredit = worksheetRows.Sum(r => r.FinancialPositionCredit);

        decimal netIncome = totalIncomeStatementCredit - totalIncomeStatementDebit;

        return this.Ok(new
        {
            success = true,
            hasPeriodSelected = true,
            selectedPeriodName = period.PeriodName,
            rows = worksheetRows.Select(r => new
            {
                accountId = r.AccountId,
                referenceNumber = r.ReferenceNumber,
                accountName = r.AccountName,
                type = r.Type,
                normalBalanceIsDebit = r.NormalBalanceIsDebit,
                tbDebit = r.UnadjustedDebit,
                tbCredit = r.UnadjustedCredit,
                adjDebit = r.AdjustmentDebit,
                adjCredit = r.AdjustmentCredit,
                adjTbDebit = r.AdjustedDebit,
                adjTbCredit = r.AdjustedCredit,
                isDebit = r.IncomeStatementDebit,
                isCredit = r.IncomeStatementCredit,
                bsDebit = r.FinancialPositionDebit,
                bsCredit = r.FinancialPositionCredit,
            }),
            totals = new
            {
                tbDebit = totalUnadjustedDebit,
                tbCredit = totalUnadjustedCredit,
                adjDebit = totalAdjustmentDebit,
                adjCredit = totalAdjustmentCredit,
                adjTbDebit = totalAdjustedDebit,
                adjTbCredit = totalAdjustedCredit,
                isDebit = totalIncomeStatementDebit,
                isCredit = totalIncomeStatementCredit,
                bsDebit = totalFinancialPositionDebit,
                bsCredit = totalFinancialPositionCredit,
                netIncome = netIncome
            },
        });
    }

    private Guid GetCurrentUserId()
    {
        var userIdStr = this.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? this.User.FindFirstValue("sub");

        return Guid.TryParse(userIdStr, out Guid userId) ? userId : Guid.Empty;
    }
}
