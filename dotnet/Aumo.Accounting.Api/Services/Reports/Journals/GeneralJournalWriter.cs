// <copyright file="GeneralJournalWriter.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.Reports.Journals;

using Aumo.Accounting.Api.Data;
using Aumo.Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;
/// <summary>
/// Mewakili General Journal Writer.
/// </summary>

public static class GeneralJournalWriter
{
    /// <summary>
    /// Mewakili Posted Status.
    /// </summary>
    public const string PostedStatus = "Posted";
    /// <summary>
    /// Mewakili Line.
    /// </summary>

    public sealed record Line(int AccountId, string? LineDescription, decimal Debit, decimal Credit);
    /// <summary>
    /// Mewakili Next Journal Entry Id Async.
    /// </summary>

    public static Task<int> NextJournalEntryIdAsync(AppDbContext db, CancellationToken ct = default)
        => db.Database
            .SqlQuery<int>($"SELECT nextval('\"GeneralJournal_JournalEntryId_seq\"')::int AS \"Value\"")
            .SingleAsync(ct);
    /// <summary>
    /// Proses eksekusi kalkulasi Build Rows.
    /// </summary>

    public static List<GeneralJournal> BuildRows(
        int journalEntryId,
        Guid userId,
        string transactionNumber,
        string journalType,
        DateTime entryDate,
        DateTime createdAt,
        DateTime? updatedAt,
        IEnumerable<Line> lines,
        string status = PostedStatus)
    {
        int order = 0;
        return lines.Select(l => new GeneralJournal
        {
            JournalEntryId = journalEntryId,
            UserId = userId,
            TransactionNumber = transactionNumber,
            JournalType = journalType,
            EntryDate = entryDate,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            Status = status,
            AccountId = l.AccountId,
            LineDescription = l.LineDescription,
            Debit = l.Debit,
            Credit = l.Credit,
            LineOrder = order++,
        }).ToList();
    }
}
