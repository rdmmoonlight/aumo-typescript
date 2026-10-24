// <copyright file="GatewayHeaderExtensions.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authentication;

namespace Accounting.Api.Authentication;

/// <summary>
/// Ekstensi pendaftaran skema autentikasi gateway.
/// </summary>
public static class GatewayHeaderExtensions
{
    /// <summary>
    /// Mendaftarkan skema autentikasi <see cref="GatewayHeaderOptions.SchemeName"/>.
    /// </summary>
    /// <param name="builder">Builder autentikasi.</param>
    /// <returns>Builder yang sama untuk chaining.</returns>
    public static AuthenticationBuilder AddGatewayHeader(this AuthenticationBuilder builder)
    {
        return builder.AddScheme<GatewayHeaderOptions, GatewayHeaderHandler>(GatewayHeaderOptions.SchemeName, _ => { });
    }
}
