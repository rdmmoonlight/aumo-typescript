namespace Accounting.Api.Models;

using System;
using System.Collections.Generic;

public partial class GeneralJournal
{
    public int LineId { get; set; }

    public int AccountId { get; set; }

    public string? LineDescription { get; set; }

    public decimal Debit { get; set; }

    public decimal Credit { get; set; }

    public int LineOrder { get; set; }

    public int JournalEntryId { get; set; }

    public string JournalType { get; set; } = null!;

    public DateTime EntryDate { get; set; }

    public string TransactionNumber { get; set; } = null!;

    public Guid UserId { get; set; }

    public string? Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ChartOfAccount Account { get; set; } = null!;

    public virtual ICollection<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = new List<GeneralLedgerPermanentAccount>();

    public virtual ICollection<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = new List<GeneralLedgerTemporaryAccount>();
}