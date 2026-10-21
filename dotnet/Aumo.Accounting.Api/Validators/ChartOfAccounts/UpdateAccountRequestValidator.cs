// <copyright file="UpdateAccountRequestValidator.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Validators.ChartOfAccounts;

using Aumo.Accounting.Api.DTOs;
using Aumo.Accounting.Api.Models;
using FluentValidation;
/// <summary>
/// Validator untuk Update Account Request Validator.
/// </summary>

public class UpdateAccountRequestValidator : AbstractValidator<UpdateAccountRequest>
{
    /// <summary>
    /// Validator untuk Update Account Request Validator.
    /// </summary>
    public UpdateAccountRequestValidator()
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
