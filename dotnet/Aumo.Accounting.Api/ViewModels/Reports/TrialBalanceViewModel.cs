// <copyright file="TrialBalanceViewModel.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.ViewModels.Reports;

using System;
using System.Collections.Generic;
using System.Linq;
using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.DTOs.Reports;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;


/// <summary>
/// Mewakili Trial Balance Row.
/// </summary>

public class TrialBalanceRow
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

    public string? Type { get; set; }
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string? Role { get; set; }
    /// <summary>
    /// Mewakili Normal Balance Is Debit.
    /// </summary>

    public bool NormalBalanceIsDebit { get; set; }
    /// <summary>
    /// Mewakili Net Balance.
    /// </summary>

    public decimal NetBalance { get; set; }
    /// <summary>
    /// Mewakili Debit.
    /// </summary>

    public decimal Debit { get; set; }
    /// <summary>
    /// Mewakili Credit.
    /// </summary>

    public decimal Credit { get; set; }
}
/// <summary>
/// Model data Trial Balance View Model.
/// </summary>

public class TrialBalanceViewModel
{
    /// <summary>
    /// Mewakili Title.
    /// </summary>
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Rows.
    /// </summary>

    public List<TrialBalanceRow> Rows { get; set; } = new();
    /// <summary>
    /// Mewakili Total Debit.
    /// </summary>

    public decimal TotalDebit => this.Rows.Sum(r => r.Debit);
    /// <summary>
    /// Mewakili Total Credit.
    /// </summary>

    public decimal TotalCredit => this.Rows.Sum(r => r.Credit);
    /// <summary>
    /// Mewakili Is Balanced.
    /// </summary>

    public bool IsBalanced => Math.Round(this.TotalDebit - this.TotalCredit, 2) == 0;
}
