// <copyright file="AccountClassificationExtensions.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.Models;

/// <summary>
/// Mewakili Account Classification Extensions.
/// </summary>
public static class AccountClassificationExtensions
{
    /// <summary>
    /// Mewakili Normal Balance Is Debit.
    /// </summary>
    public static bool NormalBalanceIsDebit(this AccountClassification classification)
    {
        return classification == AccountClassification.Asset
            || classification == AccountClassification.Expense;
    }

    /// <summary>
    /// Mewakili Is Temporary.
    /// </summary>
    public static bool IsTemporary(this AccountClassification classification)
    {
        return classification == AccountClassification.Revenue
            || classification == AccountClassification.Expense;
    }

    /// <summary>
    /// Mewakili Is Permanent.
    /// </summary>
    public static bool IsPermanent(this AccountClassification classification)
    {
        return !IsTemporary(classification);
    }
}
