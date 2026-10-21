// <copyright file="AccountRuleExtensions.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Validators.ChartOfAccounts;

using Aumo.Accounting.Api.Models;
using FluentValidation;
/// <summary>
/// Mewakili Account Rule Extensions.
/// </summary>

internal static class AccountRuleExtensions
{
    /// <summary>
    /// Mewakili Max Account Name Length.
    /// </summary>
    public const int MaxAccountNameLength = 100; // selaras HasMaxLength(100) di AppDbContext
    /// <summary>
    /// Mewakili I Rule Builder Options.
    /// </summary>

    public static IRuleBuilderOptions<T, string> MustBeValidAccountName<T>(this IRuleBuilder<T, string> rule)
        => rule
            .NotEmpty().WithMessage("Account name is required.")
            .MaximumLength(MaxAccountNameLength).WithMessage($"Account name must not exceed {MaxAccountNameLength} characters.");
    /// <summary>
    /// Mewakili I Rule Builder Options.
    /// </summary>

    public static IRuleBuilderOptions<T, string> MustBeValidAccountType<T>(this IRuleBuilder<T, string> rule)
        => rule
            .NotEmpty().WithMessage("Account category type is required.")
            .Must(AccountClassificationHelper.IsKnownAccountType).WithMessage("Account category type is invalid.");
    /// <summary>
    /// Mewakili I Rule Builder Options.
    /// </summary>

    public static IRuleBuilderOptions<T, string> MustBeValidAccountRole<T>(this IRuleBuilder<T, string> rule)
        => rule
            .Must(role => string.IsNullOrWhiteSpace(role) || AccountClassificationHelper.AccountRoles.Contains(role))
            .WithMessage("Account role is invalid.");
}
