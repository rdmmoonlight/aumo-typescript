// <copyright file="ITrialBalancesService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.DTOs.Reports;
using Aumo.Accounting.Api.Models;

namespace Aumo.Accounting.Api.Services.Reports.TrialBalances;

/// <summary>
/// Antarmuka layanan untuk pembuatan 3 jenis Trial Balance (Unadjusted, Adjusted, Post-Closing).
/// </summary>
public interface ITrialBalancesService
{
    /// <summary>
    /// Membuat data Unadjusted Trial Balance.
    /// </summary>
    Task<List<TrialBalanceUnadjustedRow>> BuildUnadjustedTrialBalanceAsync(AppDbContext db, Guid userId, Period period);

    /// <summary>
    /// Membuat data Adjusted Trial Balance.
    /// </summary>
    Task<List<TrialBalanceAdjustedRow>> BuildAdjustedTrialBalanceAsync(AppDbContext db, Guid userId, Period period);

    /// <summary>
    /// Membuat data Post-Closing Trial Balance.
    /// </summary>
    Task<List<TrialBalancePostClosingRow>> BuildPostClosingTrialBalanceAsync(AppDbContext db, Guid userId, Period period);

    /// <summary>
    /// Menghitung total saldo akhir Laba Ditahan (Retained Earnings).
    /// </summary>
    Task<decimal> ComputeRetainedEarningsEndingAsync(AppDbContext db, Guid userId, Period period);
}
