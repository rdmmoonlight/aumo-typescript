// <copyright file="ChartOfAccount.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Models;

using System;
using System.Collections.Generic;

/// <summary>
/// Mewakili Chart Of Account.
/// </summary>
public partial class ChartOfAccount
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public int ReferenceNumber { get; set; }

    /// <summary>
    /// Mewakili Account Name.
    /// </summary>
    public string AccountName { get; set; } = null!;

    /// <summary>
    /// Mewakili Type.
    /// </summary>
    public string Type { get; set; } = null!;

    /// <summary>
    /// Mewakili Role.
    /// </summary>
    public string Role { get; set; } = null!;

    /// <summary>
    /// Mewakili Is Active.
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Mewakili User Id.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Mewakili Balance.
    /// </summary>
    public decimal Balance { get; set; }

    /// <summary>
    /// Mewakili Display Label.
    /// </summary>
    public string DisplayLabel => $"{this.ReferenceNumber} - {this.AccountName}";

    /// <summary>
    /// Mewakili General Journals.
    /// </summary>
    public virtual ICollection<GeneralJournal> GeneralJournals { get; set; } = new List<GeneralJournal>();

    /// <summary>
    /// Mewakili General Ledger Permanent Accounts.
    /// </summary>
    public virtual ICollection<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = new List<GeneralLedgerPermanentAccount>();

    /// <summary>
    /// Mewakili General Ledger Temporary Accounts.
    /// </summary>
    public virtual ICollection<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = new List<GeneralLedgerTemporaryAccount>();
}
