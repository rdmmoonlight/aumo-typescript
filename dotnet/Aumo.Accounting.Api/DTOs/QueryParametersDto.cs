// <copyright file="QueryParametersDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.DTOs;
/// <summary>
/// Mengambil data  Notifications Query.
/// </summary>

public class GetNotificationsQuery
{
    /// <summary>
    /// Mewakili Limit.
    /// </summary>
    public int Limit { get; set; } = 20;
}
/// <summary>
/// Mengambil data  Dashboard Query.
/// </summary>

public class GetDashboardQuery
{
    /// <summary>
    /// Mewakili Period.
    /// </summary>
    public string? Period { get; set; } = "monthly";
}
/// <summary>
/// Mengambil data  Kurs Query.
/// </summary>

public class GetKursQuery
{
    /// <summary>
    /// Mewakili Base Currency.
    /// </summary>
    public string? BaseCurrency { get; set; } = "USD";
    /// <summary>
    /// Mewakili Target Currency.
    /// </summary>

    public string? TargetCurrency { get; set; } = "IDR";
}
/// <summary>
/// Mengambil data  Accounts Query.
/// </summary>

public class GetAccountsQuery
{
    /// <summary>
    /// Mewakili Search.
    /// </summary>
    public string? Search { get; set; }
    /// <summary>
    /// Mewakili Category.
    /// </summary>

    public string? Category { get; set; }
}
/// <summary>
/// Mewakili Search Descriptions Query.
/// </summary>

public class SearchDescriptionsQuery
{
    public string? Q { get; set; }
}
/// <summary>
/// Mewakili Next Transaction Number Query.
/// </summary>

public class NextTransactionNumberQuery
{
    /// <summary>
    /// Mewakili Journal Type.
    /// </summary>
    public string? JournalType { get; set; } = "General";
    /// <summary>
    /// Mewakili Entry Date.
    /// </summary>

    public DateTime? EntryDate { get; set; }
}
