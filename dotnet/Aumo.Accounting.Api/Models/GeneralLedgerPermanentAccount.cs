// <copyright file="GeneralLedgerPermanentAccount.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Models;

using System;
using System.Collections.Generic;
/// <summary>
/// Mewakili General Ledger Permanent Account.
/// </summary>

public partial class GeneralLedgerPermanentAccount
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public long Id { get; set; }
    /// <summary>
    /// Mewakili User Id.
    /// </summary>

    public Guid UserId { get; set; }
    /// <summary>
    /// Mewakili Period Id.
    /// </summary>

    public int PeriodId { get; set; }
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>

    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Journal Entry Id.
    /// </summary>

    public int JournalEntryId { get; set; }
    /// <summary>
    /// Mewakili Journal Entry Line Id.
    /// </summary>

    public int JournalEntryLineId { get; set; }
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string? TransactionNumber { get; set; }
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
    /// Mewakili Running Balance.
    /// </summary>

    public decimal RunningBalance { get; set; }
    /// <summary>
    /// Mewakili Account.
    /// </summary>

    public virtual ChartOfAccount Account { get; set; } = null!;
    /// <summary>
    /// Mewakili Journal Entry Line.
    /// </summary>

    public virtual GeneralJournal JournalEntryLine { get; set; } = null!;
    /// <summary>
    /// Mewakili Period.
    /// </summary>

    public virtual Period Period { get; set; } = null!;
}
