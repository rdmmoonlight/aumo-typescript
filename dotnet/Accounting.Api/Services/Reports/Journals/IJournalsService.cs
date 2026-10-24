// <copyright file="IJournalsService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Accounting.Api.Data;
using Accounting.Api.DTOs.Reports;
using Accounting.Api.Models;
using Accounting.Api.Services.Reports.FinancialStatements;

namespace Accounting.Api.Services.Reports.Journals;

/// <summary>
/// Layanan penyusunan jurnal pada laporan akuntansi.
/// </summary>
public interface IJournalsService
{
    /// <summary>
    /// Menyusun kelompok jurnal penutup berdasarkan neraca saldo periode.
    /// </summary>
    Task<List<ClosingJournalEntryGroupApiResponse>> BuildClosingJournalGroupsAsync(AppDbContext db, Guid userId, Period period, IFinancialStatementsService reportService);
}
