// <copyright file="GeneralLedgersDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.DTOs.Reports;
/// <summary>
/// Model data Ledger Account Response.
/// </summary>

public class LedgerAccountResponse
{
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>
    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>

    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Account Type.
    /// </summary>

    public string AccountType { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty; // alias AccountType biar kompatibel FE lama
    /// <summary>
    /// Mewakili Normal Balance Is Debit.
    /// </summary>

    public bool NormalBalanceIsDebit { get; set; }
    /// <summary>
    /// Mewakili Beginning Balance.
    /// </summary>

    public decimal BeginningBalance { get; set; }
    /// <summary>
    /// Mewakili Ending Balance.
    /// </summary>

    public decimal EndingBalance { get; set; }
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<LedgerLineResponse> Lines { get; set; } = new();
}
/// <summary>
/// Model data Ledger Line Response.
/// </summary>

public class LedgerLineResponse
{
    /// <summary>
    /// Mewakili Journal Entry Id.
    /// </summary>
    public int JournalEntryId { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string TransactionNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public string EntryDate { get; set; } = string.Empty; // string format yyyy-MM-dd
    /// <summary>
    /// Mewakili Description.
    /// </summary>

    public string Description { get; set; } = string.Empty;
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
/// <summary>
/// Model data Temporary Ledger Grouped Response.
/// </summary>

public class TemporaryLedgerGroupedResponse
{
    /// <summary>
    /// Mewakili Selected Period Name.
    /// </summary>
    public string SelectedPeriodName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Net Income Before Closing.
    /// </summary>

    public decimal NetIncomeBeforeClosing { get; set; }
    /// <summary>
    /// Mewakili Accounts.
    /// </summary>

    public List<LedgerAccountResponse> Accounts { get; set; } = new();
}
/// <summary>
/// Model data Permanent Ledger Grouped Response.
/// </summary>

public class PermanentLedgerGroupedResponse
{
    /// <summary>
    /// Mewakili Selected Period Name.
    /// </summary>
    public string SelectedPeriodName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Accounts.
    /// </summary>

    public List<LedgerAccountResponse> Accounts { get; set; } = new();
}
/// <summary>
/// Model data Permanent Ledger Dto.
/// </summary>

// Internal DTO untuk baca dari staging table - tetap dipakai di service
public class PermanentLedgerDto
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>

    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Account Reference Number.
    /// </summary>

    public int AccountReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Type.
    /// </summary>

    public string AccountType { get; set; } = string.Empty;
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

    public string TransactionNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Line Description.
    /// </summary>

    public string LineDescription { get; set; } = string.Empty;
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
/// <summary>
/// Model data Temporary Ledger Dto.
/// </summary>

public class TemporaryLedgerDto : PermanentLedgerDto
{
}
