// <copyright file="GeneralLedgerViewModel.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.ViewModels.Reports;

using System;
using System.Collections.Generic;
using Accounting.Api.Controllers.Reports;
using Accounting.Api.Helpers;
using Accounting.Api.Models;


/// <summary>
/// Model data Ledger Account View Model.
/// </summary>

public class LedgerAccountViewModel
{
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>
    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>

    public string? ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Normal Balance Is Debit.
    /// </summary>

    public bool NormalBalanceIsDebit { get; set; }
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<LedgerLineViewModel> Lines { get; set; } = new();
    /// <summary>
    /// Mewakili Ending Balance.
    /// </summary>

    public decimal EndingBalance { get; set; }
}
/// <summary>
/// Model data Ledger Line View Model.
/// </summary>

public class LedgerLineViewModel
{
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>
    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Description.
    /// </summary>

    public string? Description { get; set; }
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
}
