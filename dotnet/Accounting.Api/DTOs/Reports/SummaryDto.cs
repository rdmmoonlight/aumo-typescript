// <copyright file="SummaryDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.DTOs;

using Accounting.Api.Controllers.Reports;
using Accounting.Api.DTOs;
using Accounting.Api.Helpers;
using Accounting.Api.Models;


/// <summary>
/// Model data Summary Dto.
/// </summary>

public class SummaryDto
{
    /// <summary>
    /// Mewakili Selected Period Id.
    /// </summary>
    public Guid? SelectedPeriodId { get; set; }
    /// <summary>
    /// Mewakili Total Journal.
    /// </summary>

    public int TotalJournal { get; set; }
    /// <summary>
    /// Mewakili Active Coa.
    /// </summary>

    public int ActiveCoa { get; set; }
    /// <summary>
    /// Mewakili Active Period Name.
    /// </summary>

    public string ActivePeriodName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Is Period Open.
    /// </summary>

    public bool IsPeriodOpen { get; set; }
}
/// <summary>
/// Model data Api Response.
/// </summary>

public class ApiResponse<T>
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Message.
    /// </summary>

    public string? Message { get; set; }
    /// <summary>
    /// Mewakili Data.
    /// </summary>

    public T? Data { get; set; }
}
