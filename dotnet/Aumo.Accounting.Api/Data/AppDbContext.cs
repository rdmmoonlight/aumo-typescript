#pragma warning disable CA1861
// <copyright file="AppDbContext.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Data;

using System;
using Aumo.Accounting.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

/// <summary>
/// Konteks database Entity Framework App Db Context untuk domain Akuntansi &amp; Keuangan.
/// </summary>
public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ChartOfAccount> ChartOfAccounts { get; set; } = null!;
    public virtual DbSet<GeneralJournal> GeneralJournals { get; set; } = null!;
    public virtual DbSet<GeneralLedgerPermanentAccount> GeneralLedgerPermanentAccounts { get; set; } = null!;
    public virtual DbSet<GeneralLedgerTemporaryAccount> GeneralLedgerTemporaryAccounts { get; set; } = null!;
    public virtual DbSet<Period> Periods { get; set; } = null!;
    public virtual DbSet<TransactionCounter> TransactionCounters { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Converter khusus jika properti C# = Guid tetapi kolom di DB = text (seperti tabel 'periods')
        var guidToStringConverter = new ValueConverter<Guid, string>(
            v => v.ToString(),
            v => Guid.Parse(v));

        // 1. ChartOfAccounts (tabel: "chart-of-accounts", user_id = uuid, C# UserId = Guid)
        builder.Entity<ChartOfAccount>(entity =>
        {
            entity.ToTable("chart-of-accounts");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ReferenceNumber).HasColumnName("reference_number");
            entity.Property(e => e.AccountName).HasColumnName("account_name").HasMaxLength(100);
            entity.Property(e => e.Type).HasColumnName("type");
            entity.Property(e => e.Role).HasColumnName("role");
            entity.Property(e => e.IsActive).HasColumnName("is_active");

            // Native Npgsql: Guid C# <-> uuid PostgreSQL (tanpa converter)
            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasColumnType("uuid");

            entity.HasIndex(e => e.UserId, "IX_ChartOfAccounts_UserId");
            entity.HasIndex(e => new { e.UserId, e.ReferenceNumber }, "IX_ChartOfAccounts_UserId_ReferenceNumber").IsUnique();

            entity.Ignore(e => e.Balance);
        });

        // 2. GeneralJournal (tabel: "general-journal")
        builder.Entity<GeneralJournal>(entity =>
        {
            entity.ToTable("general-journal");

            entity.HasKey(e => e.LineId);
            entity.Property(e => e.LineId).HasColumnName("id");

            entity.Property(e => e.JournalEntryId).HasColumnName("entry_id");
            entity.Property(e => e.JournalType).HasColumnName("journal_type").HasMaxLength(50);
            entity.Property(e => e.EntryDate).HasColumnName("entry_date");
            entity.Property(e => e.TransactionNumber).HasColumnName("transaction_number").HasMaxLength(30);
            entity.Property(e => e.LineDescription).HasColumnName("description").HasMaxLength(250);
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.AccountId).HasColumnName("account_id");
            entity.Property(e => e.Debit).HasColumnName("debit").HasPrecision(18, 2);
            entity.Property(e => e.Credit).HasColumnName("credit").HasPrecision(18, 2);

            // Pemetaan nama kolom snake_case
            entity.Property(e => e.LineOrder).HasColumnName("line_order");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasColumnType("uuid");

            entity.HasIndex(e => e.AccountId, "IX_GeneralJournal_AccountId");
            entity.HasIndex(e => e.JournalEntryId, "IX_GeneralJournal_JournalEntryId");
            entity.HasIndex(e => new { e.UserId, e.EntryDate }, "IX_GeneralJournal_UserId_EntryDate");
            entity.HasIndex(e => new { e.UserId, e.TransactionNumber }, "IX_GeneralJournal_UserId_TransactionNumber");

            entity.HasOne(d => d.Account)
                .WithMany(p => p.GeneralJournals)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 3. GeneralLedgerPermanentAccount
        builder.Entity<GeneralLedgerPermanentAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("GeneralLedgerPermanentAccounts_pkey");

            entity.Property(e => e.Credit).HasPrecision(18, 2);
            entity.Property(e => e.Debit).HasPrecision(18, 2);
            entity.Property(e => e.RunningBalance).HasPrecision(18, 2);
            entity.Property(e => e.TransactionNumber).HasMaxLength(100);

            entity.HasIndex(e => new { e.UserId, e.PeriodId, e.AccountId, e.EntryDate, e.Id }, "IX_GLPermanent_FetchOrdering");
            entity.HasIndex(e => new { e.UserId, e.PeriodId }, "IX_GLPermanent_UserId_PeriodId");
            entity.HasIndex(e => e.JournalEntryLineId, "IX_GeneralLedgerPermanentAccounts_JournalEntryLineId");

            entity.HasOne(d => d.Account)
                .WithMany(p => p.GeneralLedgerPermanentAccounts)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_GLPermanent_ChartOfAccounts");

            entity.HasOne(d => d.JournalEntryLine)
                .WithMany(p => p.GeneralLedgerPermanentAccounts)
                .HasForeignKey(d => d.JournalEntryLineId)
                .HasConstraintName("FK_GLPermanent_GeneralJournal_LineId");

            entity.HasOne(d => d.Period)
                .WithMany(p => p.GeneralLedgerPermanentAccounts)
                .HasForeignKey(d => d.PeriodId)
                .HasConstraintName("FK_GLPermanent_Periods");
        });

        // 4. GeneralLedgerTemporaryAccount
        builder.Entity<GeneralLedgerTemporaryAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("GeneralLedgerTemporaryAccounts_pkey");

            entity.Property(e => e.Credit).HasPrecision(18, 2);
            entity.Property(e => e.Debit).HasPrecision(18, 2);
            entity.Property(e => e.RunningBalance).HasPrecision(18, 2);
            entity.Property(e => e.TransactionNumber).HasMaxLength(100);

            entity.HasIndex(e => new { e.UserId, e.PeriodId, e.AccountId, e.EntryDate, e.Id }, "IX_GLTemporary_FetchOrdering");
            entity.HasIndex(e => new { e.UserId, e.PeriodId }, "IX_GLTemporary_UserId_PeriodId");
            entity.HasIndex(e => e.JournalEntryLineId, "IX_GeneralLedgerTemporaryAccounts_JournalEntryLineId");

            entity.HasOne(d => d.Account)
                .WithMany(p => p.GeneralLedgerTemporaryAccounts)
                .HasForeignKey(d => d.AccountId)
                .HasConstraintName("FK_GLTemporary_ChartOfAccounts");

            entity.HasOne(d => d.JournalEntryLine)
                .WithMany(p => p.GeneralLedgerTemporaryAccounts)
                .HasForeignKey(d => d.JournalEntryLineId)
                .HasConstraintName("FK_GLTemporary_GeneralJournal_LineId");

            entity.HasOne(d => d.Period)
                .WithMany(p => p.GeneralLedgerTemporaryAccounts)
                .HasForeignKey(d => d.PeriodId)
                .HasConstraintName("FK_GLTemporary_Periods");
        });

        // 5. Period (tabel: "periods", user_id = text, C# UserId = Guid)
        builder.Entity<Period>(entity =>
        {
            entity.ToTable("periods");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PeriodName).HasColumnName("period_name").HasMaxLength(50);
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsClosed).HasColumnName("is_closed").HasDefaultValue(false);
            entity.Property(e => e.IsSelected).HasColumnName("is_selected").HasDefaultValue(false);

            // Butuh Converter: Guid C# <-> text PostgreSQL
            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasConversion(guidToStringConverter)
                .HasColumnType("text");

            entity.HasIndex(e => e.UserId, "IX_Periods_UserId");
            entity.HasIndex(e => e.UserId, "IX_Periods_IsSelected_Unique")
                .IsUnique()
                .HasFilter("(\"is_selected\" = true)");
        });

        // 6. TransactionCounter (tabel: "transaction-counters", user_id = uuid, C# UserId = Guid)
        builder.Entity<TransactionCounter>(entity =>
        {
            entity.ToTable("transaction-counters");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CounterKey).HasColumnName("counter_key").HasMaxLength(10);
            entity.Property(e => e.LastSequence).HasColumnName("last_sequence");

            // Native Npgsql: Guid C# <-> uuid PostgreSQL (tanpa converter)
            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasColumnType("uuid");

            entity.HasIndex(e => new { e.UserId, e.CounterKey }, "IX_TransactionCounters_UserId_CounterKey").IsUnique();
        });

        this.OnModelCreatingPartial(builder);
    }

    partial void OnModelCreatingPartial(ModelBuilder builder);
}