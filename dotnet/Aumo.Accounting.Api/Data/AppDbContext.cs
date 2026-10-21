using Microsoft.EntityFrameworkCore.Metadata.Builders;
#pragma warning disable CA1861
// <copyright file="AppDbContext.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Data;

using Aumo.Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Konteks database Entity Framework App Db Context untuk domain Akuntansi &amp; Keuangan.
/// </summary>
public partial class AppDbContext : DbContext
{
    /// <summary>
    /// Konteks database Entity Framework App Db Context.
    /// </summary>
    public AppDbContext()
    {
    }

    /// <summary>
    /// Konteks database Entity Framework App Db Context.
    /// </summary>
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Mewakili Chart Of Accounts.
    /// </summary>
    public virtual DbSet<ChartOfAccount> ChartOfAccounts { get; set; } = null!;

    /// <summary>
    /// Mewakili General Journals.
    /// </summary>
    public virtual DbSet<GeneralJournal> GeneralJournals { get; set; } = null!;

    /// <summary>
    /// Mewakili General Ledger Permanent Accounts.
    /// </summary>
    public virtual DbSet<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = null!;

    /// <summary>
    /// Mewakili General Ledger Temporary Accounts.
    /// </summary>
    public virtual DbSet<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = null!;

    /// <summary>
    /// Mewakili Periods.
    /// </summary>
    public virtual DbSet<Period> Periods { get; set; } = null!;

    /// <summary>
    /// Mewakili Transaction Counters.
    /// </summary>
    public virtual DbSet<TransactionCounter> TransactionCounters { get; set; } = null!;

    /// <summary>
    /// Konfigurasi hook/event On Configuring.
    /// </summary>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
        }
    }

    /// <summary>
    /// Konfigurasi hook/event On Model Creating.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ChartOfAccount>(entity =>
        {
            entity.HasIndex(e => e.UserId, "IX_ChartOfAccounts_UserId");

            entity.HasIndex(e => new { e.UserId, e.ReferenceNumber }, "IX_ChartOfAccounts_UserId_ReferenceNumber").IsUnique();

            entity.Property(e => e.AccountName).HasMaxLength(100);

            // Balance dihitung di memori dari GeneralJournal (bukan kolom tabel).
            entity.Ignore(e => e.Balance);
        });

        builder.Entity<GeneralJournal>(entity =>
        {
            entity.HasKey(e => e.LineId);

            entity.ToTable("GeneralJournal");

            entity.HasIndex(e => e.AccountId, "IX_GeneralJournal_AccountId");

            entity.HasIndex(e => e.JournalEntryId, "IX_GeneralJournal_JournalEntryId");

            entity.HasIndex(e => new { e.UserId, e.EntryDate }, "IX_GeneralJournal_UserId_EntryDate");

            entity.HasIndex(e => new { e.UserId, e.TransactionNumber }, "IX_GeneralJournal_UserId_TransactionNumber");

            entity.Property(e => e.Credit).HasPrecision(18, 2);
            entity.Property(e => e.Debit).HasPrecision(18, 2);
            entity.Property(e => e.JournalType).HasMaxLength(50);
            entity.Property(e => e.LineDescription).HasMaxLength(250);
            entity.Property(e => e.LineOrder).HasDefaultValue(0);
            entity.Property(e => e.TransactionNumber).HasMaxLength(30);

            entity.HasOne(d => d.Account).WithMany(p => p.GeneralJournals)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<GeneralLedgerPermanentAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("GeneralLedgerPermanentAccounts_pkey");

            entity.HasIndex(e => new { e.UserId, e.PeriodId, e.AccountId, e.EntryDate, e.Id }, "IX_GLPermanent_FetchOrdering");

            entity.HasIndex(e => new { e.UserId, e.PeriodId }, "IX_GLPermanent_UserId_PeriodId");

            entity.HasIndex(e => e.JournalEntryLineId, "IX_GeneralLedgerPermanentAccounts_JournalEntryLineId");

            entity.Property(e => e.Credit).HasPrecision(18, 2);
            entity.Property(e => e.Debit).HasPrecision(18, 2);
            entity.Property(e => e.RunningBalance).HasPrecision(18, 2);
            entity.Property(e => e.TransactionNumber).HasMaxLength(100);

            entity.HasOne(d => d.Account).WithMany(p => p.GeneralLedgerPermanentAccounts)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_GLPermanent_ChartOfAccounts");

            entity.HasOne(d => d.JournalEntryLine).WithMany(p => p.GeneralLedgerPermanentAccounts)
                .HasForeignKey(d => d.JournalEntryLineId)
                .HasConstraintName("FK_GLPermanent_GeneralJournal_LineId");

            entity.HasOne(d => d.Period).WithMany(p => p.GeneralLedgerPermanentAccounts)
                .HasForeignKey(d => d.PeriodId)
                .HasConstraintName("FK_GLPermanent_Periods");
        });

        builder.Entity<GeneralLedgerTemporaryAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("GeneralLedgerTemporaryAccounts_pkey");

            entity.HasIndex(e => new { e.UserId, e.PeriodId, e.AccountId, e.EntryDate, e.Id }, "IX_GLTemporary_FetchOrdering");

            entity.HasIndex(e => new { e.UserId, e.PeriodId }, "IX_GLTemporary_UserId_PeriodId");

            entity.HasIndex(e => e.JournalEntryLineId, "IX_GeneralLedgerTemporaryAccounts_JournalEntryLineId");

            entity.Property(e => e.Credit).HasPrecision(18, 2);
            entity.Property(e => e.Debit).HasPrecision(18, 2);
            entity.Property(e => e.RunningBalance).HasPrecision(18, 2);
            entity.Property(e => e.TransactionNumber).HasMaxLength(100);

            entity.HasOne(d => d.Account).WithMany(p => p.GeneralLedgerTemporaryAccounts)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_GLTemporary_ChartOfAccounts");

            entity.HasOne(d => d.JournalEntryLine).WithMany(p => p.GeneralLedgerTemporaryAccounts)
                .HasForeignKey(d => d.JournalEntryLineId)
                .HasConstraintName("FK_GLTemporary_GeneralJournal_LineId");

            entity.HasOne(d => d.Period).WithMany(p => p.GeneralLedgerTemporaryAccounts)
                .HasForeignKey(d => d.PeriodId)
                .HasConstraintName("FK_GLTemporary_Periods");
        });

        builder.Entity<Period>(entity =>
        {
            entity.HasIndex(e => e.UserId, "IX_Periods_IsSelected_Unique")
                .IsUnique()
                .HasFilter("(\"IsSelected\" = true)");

            entity.HasIndex(e => e.UserId, "IX_Periods_UserId");

            entity.Property(e => e.IsClosed).HasDefaultValue(false);
            entity.Property(e => e.IsSelected).HasDefaultValue(false);
            entity.Property(e => e.PeriodName).HasMaxLength(50);
        });

        builder.Entity<TransactionCounter>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TransactionCounters_pkey");

            entity.HasIndex(e => new { e.UserId, e.CounterKey }, "IX_TransactionCounters_UserId_CounterKey").IsUnique();

            entity.Property(e => e.CounterKey).HasMaxLength(10);
        });

        builder.HasSequence<int>("GeneralJournal_JournalEntryId_seq");

        this.OnModelCreatingPartial(builder);
    }

    partial void OnModelCreatingPartial(ModelBuilder builder);
}
