// <copyright file="IPeriodsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Services.Periods;

using Accounting.Api.DTOs;
/// <summary>
/// Layanan logika bisnis untuk I Periods Service.
/// </summary>

public interface IPeriodsService
{
    /// <summary>
    /// Mengambil data  Periods Async.
    /// </summary>
    Task<GetPeriodsResponse> GetPeriodsAsync(Guid userId);
    /// <summary>
    /// Mengambil data  Open Period Info Async.
    /// </summary>

    Task<OpenPeriodInfoResponse> GetOpenPeriodInfoAsync(Guid userId);
    /// <summary>
    /// Membuat data  Period Async baru.
    /// </summary>

    Task<CreatePeriodResult> CreatePeriodAsync(Guid userId, CreatePeriodRequest request);
    /// <summary>
    /// Mewakili Select Period Async.
    /// </summary>

    Task<SelectPeriodResult?> SelectPeriodAsync(Guid userId, int periodId);
    /// <summary>
    /// Mewakili Clear Selection Async.
    /// </summary>

    Task<BaseServiceResult> ClearSelectionAsync(Guid userId);
    /// <summary>
    /// Mewakili Close Period Async.
    /// </summary>

    Task<BaseServiceResult> ClosePeriodAsync(Guid userId, int periodId);
}
