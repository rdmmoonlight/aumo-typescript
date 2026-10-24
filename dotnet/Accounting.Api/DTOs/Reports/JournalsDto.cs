// <copyright file="JournalsDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.DTOs.Reports;
/// <summary>
/// Model data General Journal Response Dto.
/// </summary>

// ==========================================
// RESPONSE DTOs
// ==========================================

public class GeneralJournalResponseDto
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }

    public int JournalEntryId
    {
        get => this.Id;
        set => this.Id = value;
    }
    /// <summary>
    /// Mewakili Journal Type.
    /// </summary>

    public string JournalType { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string TransactionNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili User Id.
    /// </summary>

    public Guid UserId { get; set; }
    /// <summary>
    /// Mewakili Status.
    /// </summary>

    public string Status { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Is Locked.
    /// </summary>

    public bool IsLocked { get; set; }
    /// <summary>
    /// Membuat data d At baru.
    /// </summary>

    public DateTime CreatedAt { get; set; }
    /// <summary>
    /// Memperbarui data d At.
    /// </summary>

    public DateTime? UpdatedAt { get; set; }
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<GeneralJournalLineDto> Lines { get; set; } = new();
    /// <summary>
    /// Mewakili Total Debit.
    /// </summary>

    public decimal TotalDebit => this.Lines.Sum(l => l.Debit);
    /// <summary>
    /// Mewakili Total Credit.
    /// </summary>

    public decimal TotalCredit => this.Lines.Sum(l => l.Credit);
}
/// <summary>
/// Model data Create General Journal Response Dto.
/// </summary>

public class CreateGeneralJournalResponseDto : GeneralJournalResponseDto
{
}
/// <summary>
/// Model data General Journal Line Dto.
/// </summary>

public class GeneralJournalLineDto
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }

    public int LineId
    {
        get => this.Id;
        set => this.Id = value;
    }
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>

    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Line Description.
    /// </summary>

    public string? LineDescription { get; set; }

    public string? Description
    {
        get => this.LineDescription;
        set => this.LineDescription = value;
    }
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
}
/// <summary>
/// Model data Flat General Journal Response Dto.
/// </summary>

public class FlatGeneralJournalResponseDto
{
    /// <summary>
    /// Mewakili Line Id.
    /// </summary>
    public int LineId { get; set; }
    /// <summary>
    /// Mewakili Journal Entry Id.
    /// </summary>

    public int JournalEntryId { get; set; }
    /// <summary>
    /// Mewakili Journal Type.
    /// </summary>

    public string JournalType { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string TransactionNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili User Id.
    /// </summary>

    public Guid UserId { get; set; }
    /// <summary>
    /// Mewakili Status.
    /// </summary>

    public string Status { get; set; } = string.Empty;
    /// <summary>
    /// Membuat data d At baru.
    /// </summary>

    public DateTime CreatedAt { get; set; }
    /// <summary>
    /// Memperbarui data d At.
    /// </summary>

    public DateTime? UpdatedAt { get; set; }
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
}
/// <summary>
/// Model data Closing Journal Entry Group Api Response.
/// </summary>

// ==========================================
// CLOSING JOURNAL DTOs
// ==========================================
public class ClosingJournalEntryGroupApiResponse
{
    /// <summary>
    /// Mewakili Title.
    /// </summary>
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Description.
    /// </summary>

    public string Description { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<ClosingJournalLineApiResponse> Lines { get; set; } = new();
    /// <summary>
    /// Mewakili Total Debit.
    /// </summary>

    public decimal TotalDebit => this.Lines.Sum(l => l.Debit);
    /// <summary>
    /// Mewakili Total Credit.
    /// </summary>

    public decimal TotalCredit => this.Lines.Sum(l => l.Credit);
}
/// <summary>
/// Model data Closing Journal Line Api Response.
/// </summary>

public class ClosingJournalLineApiResponse
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public string ReferenceNumber { get; set; } = "0";
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
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
/// Model data Create General Journal Request.
/// </summary>

// ==========================================
// REQUEST DTOs
// ==========================================

public class CreateGeneralJournalRequest
{
    /// <summary>
    /// Mewakili Journal Type.
    /// </summary>
    public string JournalType { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string TransactionNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Status.
    /// </summary>

    public string Status { get; set; } = "Posted";
    /// <summary>
    /// Membuat data d At baru.
    /// </summary>

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<CreateGeneralJournalLineRequest> Lines { get; set; } = new();
}
/// <summary>
/// Model data Create General Journal Line Request.
/// </summary>

public class CreateGeneralJournalLineRequest
{
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>
    public int AccountId { get; set; }
    /// <summary>
    /// Mewakili Line Description.
    /// </summary>

    public string? LineDescription { get; set; }

    public string? Description
    {
        get => this.LineDescription;
        set => this.LineDescription = value;
    }
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
}
/// <summary>
/// Model data Update General Journal Request.
/// </summary>

public class UpdateGeneralJournalRequest
{
    /// <summary>
    /// Mewakili Journal Type.
    /// </summary>
    public string JournalType { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime EntryDate { get; set; }
    /// <summary>
    /// Mewakili Transaction Number.
    /// </summary>

    public string TransactionNumber { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Status.
    /// </summary>

    public string Status { get; set; } = string.Empty;
    /// <summary>
    /// Memperbarui data d At.
    /// </summary>

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>
    /// Mewakili Lines.
    /// </summary>

    public List<CreateGeneralJournalLineRequest> Lines { get; set; } = new();
}
