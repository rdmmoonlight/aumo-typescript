// <copyright file="PeriodsDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.DTOs;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Aumo.Accounting.Api.Controllers.Reports;
using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Helpers;
using Aumo.Accounting.Api.Models;


/// <summary>
/// Model data Create Period Request.
/// </summary>

public class CreatePeriodRequest
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

    public int Month { get; set; }
    /// <summary>
    /// Mewakili Year.
    /// </summary>

    public int Year { get; set; }
    /// <summary>
    /// Mewakili Setup Mode.
    /// </summary>

    public string SetupMode { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Cash Account Id.
    /// </summary>

    // Properties for ModeLoadExisting
    public int? CashAccountId { get; set; }
    /// <summary>
    /// Mewakili Bank Account Id.
    /// </summary>

    public int? BankAccountId { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Id.
    /// </summary>

    public int? RetainedEarningsAccountId { get; set; }
    /// <summary>
    /// Mewakili Cash Account Code.
    /// </summary>

    // Properties for ModeCreateNew
    public string? CashAccountCode { get; set; }
    /// <summary>
    /// Mewakili Cash Account Name.
    /// </summary>

    public string? CashAccountName { get; set; }
    /// <summary>
    /// Mewakili Cash Balance.
    /// </summary>

    public decimal? CashBalance { get; set; }
    /// <summary>
    /// Mewakili Bank Account Code.
    /// </summary>

    public string? BankAccountCode { get; set; }
    /// <summary>
    /// Mewakili Bank Account Name.
    /// </summary>

    public string? BankAccountName { get; set; }
    /// <summary>
    /// Mewakili Bank Balance.
    /// </summary>

    public decimal? BankBalance { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Code.
    /// </summary>

    public string? RetainedEarningsAccountCode { get; set; }
    /// <summary>
    /// Mewakili Retained Earnings Account Name.
    /// </summary>

    public string? RetainedEarningsAccountName { get; set; }
}
/// <summary>
/// Model data Period Dto.
/// </summary>

public class PeriodDto
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Mewakili Period Name.
    /// </summary>

    public string PeriodName { get; set; } = string.Empty;
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
}
/// <summary>
/// Model data Get Periods Response.
/// </summary>

public class GetPeriodsResponse
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Selected Period Id.
    /// </summary>

    public int? SelectedPeriodId { get; set; }
    /// <summary>
    /// Mewakili Periods.
    /// </summary>

    public List<PeriodDto> Periods { get; set; } = new();
}
/// <summary>
/// Model data Account Simple Dto.
/// </summary>

public class AccountSimpleDto
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

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Display Label.
    /// </summary>

    public string DisplayLabel { get; set; } = string.Empty;
}
/// <summary>
/// Model data Open Period Info Response.
/// </summary>

public class OpenPeriodInfoResponse
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Has Existing Permanent Accounts.
    /// </summary>

    public bool HasExistingPermanentAccounts { get; set; }
    /// <summary>
    /// Mewakili Available Cash And Bank Accounts.
    /// </summary>

    public List<AccountSimpleDto> AvailableCashAndBankAccounts { get; set; } = new();
    /// <summary>
    /// Mewakili Available Retained Earnings Accounts.
    /// </summary>

    public List<AccountSimpleDto> AvailableRetainedEarningsAccounts { get; set; } = new();
    /// <summary>
    /// Mewakili Permanent Accounts.
    /// </summary>

    public List<AccountSimpleDto> PermanentAccounts { get; set; } = new();
}
/// <summary>
/// Membuat data  Period Result baru.
/// </summary>

public class CreatePeriodResult
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Message.
    /// </summary>

    public string Message { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Period Id.
    /// </summary>

    public int? PeriodId { get; set; }
    /// <summary>
    /// Mewakili Is Server Error.
    /// </summary>

    // true bila kegagalan berasal dari server (bukan kesalahan input pengguna) -> HTTP 500.
    public bool IsServerError { get; set; }
}
/// <summary>
/// Mewakili Select Period Result.
/// </summary>

public class SelectPeriodResult
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Selected Period Id.
    /// </summary>

    public int SelectedPeriodId { get; set; }
    /// <summary>
    /// Mewakili Message.
    /// </summary>

    public string Message { get; set; } = string.Empty;
}
/// <summary>
/// Mewakili Base Service Result.
/// </summary>

public class BaseServiceResult
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Message.
    /// </summary>

    public string Message { get; set; } = string.Empty;
}
