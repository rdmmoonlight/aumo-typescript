// <copyright file="GetAccountsQueryValidator.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Validators.Queries;

using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Models;
using FluentValidation;
/// <summary>
/// Validator untuk Get Accounts Query Validator.
/// </summary>

public class GetAccountsQueryValidator : AbstractValidator<GetAccountsQuery>
{
    private const int MaxSearchLength = 100;
    /// <summary>
    /// Validator untuk Get Accounts Query Validator.
    /// </summary>

    public GetAccountsQueryValidator()
    {
        this.RuleFor(x => x.Search)
            .MaximumLength(MaxSearchLength)
            .WithMessage($"Search keyword must not exceed {MaxSearchLength} characters.");

        this.RuleFor(x => x.Category)
            .Must(AccountClassificationHelper.IsKnownAccountType)
            .When(x => !string.IsNullOrWhiteSpace(x.Category))
            .WithMessage("Account category is invalid.");
    }
}
