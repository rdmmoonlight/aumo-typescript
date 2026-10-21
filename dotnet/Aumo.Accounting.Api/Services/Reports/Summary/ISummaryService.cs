// <copyright file="ISummaryService.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Services.Reports.Summary;

using System.Security.Claims;
using Aumo.Accounting.Api.DTOs;
/// <summary>
/// Layanan logika bisnis untuk I Summary Service.
/// </summary>

public interface ISummaryService
{
    /// <summary>
    /// Mengambil data  Summary Async.
    /// </summary>
    Task<SummaryDto?> GetSummaryAsync(ClaimsPrincipal userPrincipal);
}
