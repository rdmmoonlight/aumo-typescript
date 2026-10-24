// <copyright file="IGeneralLedgersService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Services.Reports.GeneralLedgers;

using Accounting.Api.DTOs;
using Accounting.Api.DTOs.Reports;
/// <summary>
/// Layanan logika bisnis untuk I General Ledgers Service.
/// </summary>

public interface IGeneralLedgersService
{
    /// <summary>
    /// Proses eksekusi kalkulasi Refresh General Ledgers Async.
    /// </summary>
    Task<BaseServiceResult> RefreshGeneralLedgersAsync(Guid userId);
    /// <summary>
    /// Mewakili Clear Selected Period Ledgers Async.
    /// </summary>

    Task<BaseServiceResult> ClearSelectedPeriodLedgersAsync(Guid userId);
    /// <summary>
    /// Mengambil data  Permanent Ledgers Async.
    /// </summary>

    // Baru - semua bisnis GET pindah kesini
    Task<BaseServiceResult<PermanentLedgerGroupedResponse>> GetPermanentLedgersAsync(Guid userId);
    /// <summary>
    /// Mengambil data  Temporary Ledgers Async.
    /// </summary>

    Task<BaseServiceResult<TemporaryLedgerGroupedResponse>> GetTemporaryLedgersAsync(Guid userId);
}
/// <summary>
/// Mewakili Base Service Result.
/// </summary>

// Kalau BaseServiceResult kamu belum generic, tambahkan ini:
public class BaseServiceResult<T> : BaseServiceResult
{
    /// <summary>
    /// Mewakili Data.
    /// </summary>
    public T? Data { get; set; }
}
