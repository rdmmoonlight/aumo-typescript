// <copyright file="ValidationResultExtensions.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

namespace Aumo.Accounting.Api.Validators.Common;

using FluentValidation.Results;
/// <summary>
/// Mewakili Validation Result Extensions.
/// </summary>

public static class ValidationResultExtensions
{
    /// <summary>
    /// Model data To Error Response.
    /// </summary>
    public static object ToErrorResponse(this ValidationResult result)
    {
        var errors = result.Errors
            .Select(e => e.ErrorMessage)
            .Distinct()
            .ToArray();

        return new
        {
            success = false,
            message = errors.FirstOrDefault() ?? "Validation failed.",
            errors,
        };
    }
}
