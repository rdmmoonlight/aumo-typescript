// <copyright file="AccountClassification.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Models;

/// <summary>
/// Mewakili Klasifikasi Akun.
/// </summary>
public enum AccountClassification
{
    /// <summary>
    /// Mewakili Asset.
    /// </summary>
    Asset,

    /// <summary>
    /// Mewakili Liability.
    /// </summary>
    Liability,

    /// <summary>
    /// Mewakili Equity.
    /// </summary>
    Equity,

    /// <summary>
    /// Mewakili Revenue.
    /// </summary>
    Revenue,

    /// <summary>
    /// Mewakili Expense.
    /// </summary>
    Expense,
}
