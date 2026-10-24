using System;
using System.Collections.Generic;

namespace Accounting.Api.Models;

public partial class Period
{
    public int Id { get; set; }

    public string PeriodName { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsClosed { get; set; }

    public bool IsSelected { get; set; }

    public Guid UserId { get; set; }

    public virtual ICollection<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = new List<GeneralLedgerPermanentAccount>();

    public virtual ICollection<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = new List<GeneralLedgerTemporaryAccount>();
}
