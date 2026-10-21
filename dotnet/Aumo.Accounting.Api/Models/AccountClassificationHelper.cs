// <copyright file="AccountClassificationHelper.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Models;

using System;
using System.Collections.Generic;

/// <summary>
/// Mewakili Account Classification Helper.
/// </summary>
public static class AccountClassificationHelper
{
    // Rentang kode akun per kategori (selaras ACCOUNT_RANGES di frontend/coa-types.ts)
    private static readonly Dictionary<string, (int Start, int End)> ReferenceRanges = new()
    {
        ["Assets"] = (100, 199),
        ["Liabilities"] = (200, 299),
        ["Equity"] = (300, 399),
        ["OperatingIncome"] = (400, 499),
        ["OperatingExpenses"] = (500, 599),
        ["OtherIncome"] = (600, 799),
        ["OtherExpenses"] = (800, 999),
    };

    /// <summary>
    /// Mewakili Account Types.
    /// </summary>
    public static IReadOnlyCollection<string> AccountTypes => ReferenceRanges.Keys;

    /// <summary>
    /// Mewakili Account Roles.
    /// </summary>
    public static readonly string[] AccountRoles = { "Default", "CashAndEquivalents", "RetainedEarnings" };

    /// <summary>
    /// Mewakili Normal Balance Is Debit berdasarkan enum classification.
    /// </summary>
    public static bool NormalBalanceIsDebit(AccountClassification classification)
        => classification.NormalBalanceIsDebit();

    /// <summary>
    /// Mewakili Normal Balance Is Debit berdasarkan string accountType.
    /// </summary>
    public static bool NormalBalanceIsDebit(string? accountType)
    {
        return accountType switch
        {
            "Assets" or "OperatingExpenses" or "OtherExpenses" => true,
            "Liabilities" or "Equity" or "OperatingIncome" or "OtherIncome" => false,
            _ => true,
        };
    }

    /// <summary>
    /// Mewakili Is Temporary berdasarkan enum classification.
    /// </summary>
    public static bool IsTemporary(AccountClassification classification)
        => classification.IsTemporary();

    /// <summary>
    /// Mewakili Is Temporary berdasarkan string type.
    /// </summary>

    internal static bool IsTemporary(string? type)
    {
        return type switch
        {
            "OperatingIncome" or "OperatingExpenses" or "OtherIncome" or "OtherExpenses" => true,
            "Assets" or "Liabilities" or "Equity" => false,
            _ => false,
        };
    }

    /// <summary>
    /// Mewakili Is Permanent berdasarkan enum classification.
    /// </summary>
    public static bool IsPermanent(AccountClassification classification)
        => classification.IsPermanent();

    /// <summary>
    /// Mewakili Is Permanent berdasarkan string type.
    /// </summary>

    internal static bool IsPermanent(string? type) => !IsTemporary(type);

    /// <summary>
    /// Validasi format string angka reference number.
    /// </summary>
    public static bool ValidateReferenceNumber(string? refNum)
    {
        if (string.IsNullOrWhiteSpace(refNum))
        {
            return false;
        }

        return int.TryParse(refNum, out _);
    }

    /// <summary>
    /// Validasi kecocokan nomor referensi dengan tipe akun.
    /// </summary>

    internal static bool ValidateReferenceNumber(string type, int referenceNumber)
    {
        return ReferenceRanges.TryGetValue(type ?? string.Empty, out var range)
            && referenceNumber >= range.Start
            && referenceNumber <= range.End;
    }

    /// <summary>
    /// Mewakili Is Known Account Type.
    /// </summary>
    public static bool IsKnownAccountType(string? type)
        => type != null && ReferenceRanges.ContainsKey(type);
}
