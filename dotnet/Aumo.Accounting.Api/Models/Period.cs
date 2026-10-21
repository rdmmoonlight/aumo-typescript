// <copyright file="Period.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Models;

using System;
using System.Collections.Generic;
/// <summary>
/// Mewakili Period.
/// </summary>

public partial class Period
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Mewakili Period Name.
    /// </summary>

    public string PeriodName { get; set; } = null!;
    /// <summary>
    /// Mewakili Start Date.
    /// </summary>

    public DateTime StartDate { get; set; }
    /// <summary>
    /// Mewakili End Date.
    /// </summary>

    public DateTime EndDate { get; set; }
    /// <summary>
    /// Mewakili Is Closed.
    /// </summary>

    public bool IsClosed { get; set; }
    /// <summary>
    /// Mewakili Is Selected.
    /// </summary>

    public bool IsSelected { get; set; }
    /// <summary>
    /// Mewakili User Id.
    /// </summary>

    public Guid UserId { get; set; }
    /// <summary>
    /// Mewakili General Ledger Permanent Accounts.
    /// </summary>

    public virtual ICollection<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = new List<GeneralLedgerPermanentAccount>();
    /// <summary>
    /// Mewakili General Ledger Temporary Accounts.
    /// </summary>

    public virtual ICollection<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = new List<GeneralLedgerTemporaryAccount>();
}
