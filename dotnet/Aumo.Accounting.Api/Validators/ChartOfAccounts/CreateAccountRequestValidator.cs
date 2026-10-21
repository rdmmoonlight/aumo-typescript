// <copyright file="CreateAccountRequestValidator.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Validators.ChartOfAccounts;

using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Models;
using FluentValidation;
/// <summary>
/// Validator untuk Create Account Request Validator.
/// </summary>

public class CreateAccountRequestValidator : AbstractValidator<CreateAccountRequest>
{
    /// <summary>
    /// Validator untuk Create Account Request Validator.
    /// </summary>
    public CreateAccountRequestValidator()
    {
        this.RuleFor(x => x.AccountName).MustBeValidAccountName();
        this.RuleFor(x => x.Type).MustBeValidAccountType();
        this.RuleFor(x => x.Role).MustBeValidAccountRole();

        this.RuleFor(x => x.ReferenceNumber)
            .Must((r, n) => AccountClassificationHelper.ValidateReferenceNumber(r.Type, n))
            .When(x => AccountClassificationHelper.IsKnownAccountType(x.Type))
            .WithMessage(r => $"Invalid reference number {r.ReferenceNumber} for category {r.Type}.");
    }
}
