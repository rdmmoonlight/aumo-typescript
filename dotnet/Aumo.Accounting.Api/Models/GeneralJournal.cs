// <copyright file="GeneralJournal.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Models;

using System;
using System.Collections.Generic;
/// <summary>
/// Mewakili General Journal.
/// </summary>

public partial class GeneralJournal
{
    /// <summary>
    /// Mewakili Line Id.
    /// </summary>
    public int LineId { get; set; }
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>

    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Line Description.
    /// </summary>

    public string? LineDescription { get; set; }
    /// <summary>
    /// Mewakili Debit.
    /// </summary>

    public decimal Debit { get; set; }
    /// <summary>
    /// Mewakili Credit.
    /// </summary>

    public decimal Credit { get; set; }
    /// <summary>
    /// Mewakili Line Order.
    /// </summary>

    public int LineOrder { get; set; }
    /// <summary>
    /// Mewakili Journal Entry Id.
    /// </summary>

    public int JournalEntryId { get; set; }
    /// <summary>
    /// Mewakili Journal Type.
    /// </summary>

    public string JournalType { get; set; } = null!;
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string TransactionNumber { get; set; } = null!;
    /// <summary>
    /// Mewakili User Id.
    /// </summary>

    public Guid UserId { get; set; }
    /// <summary>
    /// Mewakili Status.
    /// </summary>

    public string? Status { get; set; }
    /// <summary>
    /// Membuat data d At baru.
    /// </summary>

    public DateTime CreatedAt { get; set; }
    /// <summary>
    /// Memperbarui data d At.
    /// </summary>

    public DateTime? UpdatedAt { get; set; }
    /// <summary>
    /// Mewakili Account.
    /// </summary>

    public virtual ChartOfAccount Account { get; set; } = null!;
    /// <summary>
    /// Mewakili General Ledger Permanent Accounts.
    /// </summary>

    public virtual ICollection<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = new List<GeneralLedgerPermanentAccount>();
    /// <summary>
    /// Mewakili General Ledger Temporary Accounts.
    /// </summary>

    public virtual ICollection<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = new List<GeneralLedgerTemporaryAccount>();
}
