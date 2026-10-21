// <copyright file="PeriodsViewModel.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.ViewModels;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;


/// <summary>
/// Model data Open Period View Model.
/// </summary>

public class OpenPeriodViewModel
{
    /// <summary>
    /// Mewakili Mode Load Existing.
    /// </summary>
    public const string ModeLoadExisting = "LoadExisting";
    /// <summary>
    /// Mewakili Mode Create New.
    /// </summary>
    public const string ModeCreateNew = "CreateNew";
    /// <summary>
    /// Mewakili Month.
    /// </summary>

    [Required]
    [Display(Name = "Month")]
    public int Month { get; set; }
    /// <summary>
    /// Mewakili Year.
    /// </summary>

    [Required]
    [Display(Name = "Year")]
    public int Year { get; set; }
    /// <summary>
    /// Mewakili Setup Mode.
    /// </summary>

    [Required]
    public string SetupMode { get; set; } = ModeLoadExisting;
    /// <summary>
    /// Mewakili Cash Account Id.
    /// </summary>

    [Display(Name = "Cash Account")]
    public int? CashAccountId { get; set; }
    /// <summary>
    /// Mewakili Bank Account Id.
    /// </summary>

    [Display(Name = "Bank Account")]
    public int? BankAccountId { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Id.
    /// </summary>

    [Display(Name = "Retained Earnings Account")]
    public int? RetainedEarningsAccountId { get; set; }
    /// <summary>
    /// Mewakili Cash Account Code.
    /// </summary>

    [Display(Name = "Cash Account Ref (Code)")]
    public string? CashAccountCode { get; set; }
    /// <summary>
    /// Mewakili Cash Account Name.
    /// </summary>

    [Display(Name = "Cash Account Name")]
    public string? CashAccountName { get; set; }
    /// <summary>
    /// Mewakili Cash Balance.
    /// </summary>

    [Display(Name = "Cash Opening Balance")]
    [Range(0, double.MaxValue, ErrorMessage = "Balance cannot be negative.")]
    public decimal? CashBalance { get; set; }
    /// <summary>
    /// Mewakili Bank Account Code.
    /// </summary>

    [Display(Name = "Bank Account Ref (Code)")]
    public string? BankAccountCode { get; set; }
    /// <summary>
    /// Mewakili Bank Account Name.
    /// </summary>

    [Display(Name = "Bank Account Name")]
    public string? BankAccountName { get; set; }
    /// <summary>
    /// Mewakili Bank Balance.
    /// </summary>

    [Display(Name = "Bank Opening Balance")]
    [Range(0, double.MaxValue, ErrorMessage = "Balance cannot be negative.")]
    public decimal? BankBalance { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Code.
    /// </summary>

    [Display(Name = "Retained Earnings Ref (Code)")]
    public string? RetainedEarningsAccountCode { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Name.
    /// </summary>

    [Display(Name = "Retained Earnings Name")]
    public string? RetainedEarningsAccountName { get; set; }
    /// <summary>
    /// Mewakili Permanent Accounts.
    /// </summary>

    public List<ChartOfAccount> PermanentAccounts { get; set; } = new();
    /// <summary>
    /// Mewakili Available Cash And Bank Accounts.
    /// </summary>

    public List<ChartOfAccount> AvailableCashAndBankAccounts { get; set; } = new();
    /// <summary>
    /// Mewakili Available Retained Earnings Accounts.
    /// </summary>

    public List<ChartOfAccount> AvailableRetainedEarningsAccounts { get; set; } = new();
    /// <summary>
    /// Mewakili Has Existing Permanent Accounts.
    /// </summary>

    public bool HasExistingPermanentAccounts { get; set; }
}
