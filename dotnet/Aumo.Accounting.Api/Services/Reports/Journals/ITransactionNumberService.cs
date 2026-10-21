// <copyright file="ITransactionNumberService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.Reports.Journals;
/// <summary>
/// Layanan logika bisnis untuk I Transaction Number Service.
/// </summary>

public interface ITransactionNumberService
{
    /// <summary>
    /// Proses eksekusi kalkulasi Generate Async.
    /// </summary>
    Task<string> GenerateAsync(Guid userId, string journalType, DateTime entryDate);
    /// <summary>
    /// Mewakili Peek Next Async.
    /// </summary>

    Task<string> PeekNextAsync(Guid userId, string journalType, DateTime entryDate);
}
