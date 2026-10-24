// <copyright file="TrialBalancesDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using System;

namespace Accounting.Api.DTOs.Reports;

/// <summary>
/// Mewakili Trial Balances Row.
/// </summary>
public class TrialBalancesRow
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
    /// Mewakili Account Number.
    /// </summary>
    public string AccountNumber { get; set; } = string.Empty;

    /// <summary>
    /// Mewakili Account Name.
    /// </summary>
    public string AccountName { get; set; } = string.Empty;

    /// <summary>
    /// Mewakili Debit Balance.
    /// </summary>
    public decimal DebitBalance { get; set; }

    /// <summary>
    /// Mewakili Credit Balance.
    /// </summary>
    public decimal CreditBalance { get; set; }

    /// <summary>
    /// Mewakili Is Total Row.
    /// </summary>
    public bool IsTotalRow { get; set; }

    /// <summary>
    /// Mewakili Created At.
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }
}

/// <summary>
/// Baris Trial Balance (dipakai Worksheet, Income Statement, dan Financial Position).
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
    public string ReferenceNumber { get; set; } = string.Empty;

    /// <summary>
    /// Mewakili Account Name.
    /// </summary>
    public string AccountName { get; set; } = string.Empty;

    /// <summary>
    /// Mewakili Type.
    /// </summary>
    public string Type { get; set; } = string.Empty;

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
/// Baris Unadjusted Trial Balance.
/// </summary>
public class TrialBalanceUnadjustedRow : TrialBalancesRow
{
}

/// <summary>
/// Baris Adjusted Trial Balance.
/// </summary>
public class TrialBalanceAdjustedRow : TrialBalancesRow
{
}

/// <summary>
/// Baris Post-Closing Trial Balance.
/// </summary>
public class TrialBalancePostClosingRow : TrialBalancesRow
{
}
