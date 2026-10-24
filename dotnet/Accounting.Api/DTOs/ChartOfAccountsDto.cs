// <copyright file="ChartOfAccountsDto.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Accounting.Api.DTOs;

using System;
using System.Collections.Generic;
using Accounting.Api.Controllers.Reports;
using Accounting.Api.DTOs;
using Accounting.Api.Helpers;
using Accounting.Api.Models;


/// <summary>
/// Model data Account Item Dto.
/// </summary>

public class AccountItemDto
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>

    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string Role { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Is Active.
    /// </summary>

    public bool IsActive { get; set; }
    /// <summary>
    /// Mewakili Balance.
    /// </summary>

    public decimal Balance { get; set; }
}
/// <summary>
/// Model data Chart Of Accounts List Response Dto.
/// </summary>

public class ChartOfAccountsListResponseDto
{
    /// <summary>
    /// Mewakili Success.
    /// </summary>
    public bool Success { get; set; }
    /// <summary>
    /// Mewakili Selected Period Name.
    /// </summary>

    public string? SelectedPeriodName { get; set; }
    /// <summary>
    /// Mewakili Accounts.
    /// </summary>

    public IEnumerable<AccountItemDto> Accounts { get; set; } = new List<AccountItemDto>();
}
/// <summary>
/// Model data Create Account Request Dto.
/// </summary>

public class CreateAccountRequestDto
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string? Role { get; set; }
}
/// <summary>
/// Model data Update Account Request Dto.
/// </summary>

public class UpdateAccountRequestDto
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string? Role { get; set; }
    /// <summary>
    /// Mewakili Is Active.
    /// </summary>

    public bool IsActive { get; set; }
}
/// <summary>
/// Model data Service Result Dto.
/// </summary>

public class ServiceResultDto
{
    /// <summary>
    /// Mewakili Is Success.
    /// </summary>
    public bool IsSuccess { get; set; }
    /// <summary>
    /// Mewakili Message.
    /// </summary>

    public string Message { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Account Id.
    /// </summary>

    public int? AccountId { get; set; }
    /// <summary>
    /// Mewakili Status Code.
    /// </summary>

    public int StatusCode { get; set; } = 200;
}
/// <summary>
/// Model data Account Dto.
/// </summary>

public class AccountDto
{
    /// <summary>
    /// Mewakili Id.
    /// </summary>
    public int Id { get; set; }
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>

    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string Role { get; set; } = string.Empty;
}
/// <summary>
/// Model data Create Account Request.
/// </summary>

public class CreateAccountRequest
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string Role { get; set; } = string.Empty;
}
/// <summary>
/// Model data Update Account Request.
/// </summary>

public class UpdateAccountRequest
{
    /// <summary>
    /// Mewakili Reference Number.
    /// </summary>
    public int ReferenceNumber { get; set; }
    /// <summary>
    /// Mewakili Account Name.
    /// </summary>

    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Type.
    /// </summary>

    public string Type { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Role.
    /// </summary>

    public string Role { get; set; } = string.Empty;
    /// <summary>
    /// Mewakili Is Active.
    /// </summary>

    public bool IsActive { get; set; } = true;
}
