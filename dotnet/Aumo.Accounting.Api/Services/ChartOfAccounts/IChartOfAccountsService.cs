// <copyright file="IChartOfAccountsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.ChartOfAccounts;

using Aumo.Accounting.Api.DTOs;
/// <summary>
/// Layanan logika bisnis untuk I Chart Of Accounts Service.
/// </summary>

public interface IChartOfAccountsService
{
    /// <summary>
    /// Mengambil data  Accounts Async.
    /// </summary>
    Task<ChartOfAccountsListResponseDto> GetAccountsAsync(Guid userId, string? search, string? category);
    /// <summary>
    /// Membuat data  Account Async baru.
    /// </summary>

    Task<ServiceResultDto> CreateAccountAsync(Guid userId, CreateAccountRequestDto request);
    /// <summary>
    /// Memperbarui data  Account Async.
    /// </summary>

    Task<ServiceResultDto> UpdateAccountAsync(Guid userId, int accountId, UpdateAccountRequestDto request);
    /// <summary>
    /// Menghapus data  Account Async.
    /// </summary>

    Task<ServiceResultDto> DeleteAccountAsync(Guid userId, int accountId);
}
