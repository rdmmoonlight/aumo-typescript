using System.Globalization;
// <copyright file="TransactionNumberService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Services.Reports.Journals;

using System.Data;
using Accounting.Api.Data;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Layanan logika bisnis untuk Transaction Number Service.
/// </summary>

public class TransactionNumberService(AppDbContext db) : ITransactionNumberService
{
    /// <summary>
    /// Proses eksekusi kalkulasi Generate Async.
    /// </summary>
    public async Task<string> GenerateAsync(Guid userId, string journalType, DateTime entryDate)
    {
        string prefix = journalType == "Adjusting" ? "AJ" : "GJ";
        string counterKey = $"{prefix}{entryDate:yyMM}";
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        using var command = connection.CreateCommand();
        command.CommandText = @"
                INSERT INTO ""TransactionCounters"" (""UserId"", ""CounterKey"", ""LastSequence"")
                VALUES (@userId, @counterKey, 1)
                ON CONFLICT (""UserId"", ""CounterKey"")
                DO UPDATE SET ""LastSequence"" = ""TransactionCounters"".""LastSequence"" + 1
                RETURNING ""LastSequence"";";
        var userIdParam = command.CreateParameter();
        userIdParam.ParameterName = "userId";
        userIdParam.Value = userId;
        command.Parameters.Add(userIdParam);
        var counterKeyParam = command.CreateParameter();
        counterKeyParam.ParameterName = "counterKey";
        counterKeyParam.Value = counterKey;
        command.Parameters.Add(counterKeyParam);
        var rawResult = await command.ExecuteScalarAsync() ?? throw new InvalidOperationException($"Transaction counter upsert for {counterKey} returned no result.");
        int nextSeq = Convert.ToInt32(rawResult, System.Globalization.CultureInfo.InvariantCulture);
        if (nextSeq > 9999)
        {
            throw new InvalidOperationException($"Transaction number sequence for {counterKey} has reached its 9999 capacity.");
        }

        return $"{counterKey}{nextSeq:D4}";
    }
    /// <summary>
    /// Mewakili Peek Next Async.
    /// </summary>

    public async Task<string> PeekNextAsync(Guid userId, string journalType, DateTime entryDate)
    {
        string prefix = journalType == "Adjusting" ? "AJ" : "GJ";
        string counterKey = $"{prefix}{entryDate:yyMM}";
        var current = await db.TransactionCounters.Where(c => c.UserId == userId && c.CounterKey == counterKey).Select(c => (int?)c.LastSequence).FirstOrDefaultAsync();
        var previewSeq = (current ?? 0) + 1;
        return $"{counterKey}{previewSeq:D4}";
    }
}
