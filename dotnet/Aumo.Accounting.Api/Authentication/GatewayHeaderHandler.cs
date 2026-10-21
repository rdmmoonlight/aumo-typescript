// <copyright file="GatewayHeaderHandler.cs" company="PlaceholderCompany">
// Copyright (c) PlaceholderCompany. All rights reserved.
// </copyright>

using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Aumo.Accounting.Api.Authentication;

/// <summary>
/// Opsi skema autentikasi yang membaca identitas pengguna dari header gateway.
/// </summary>
public class GatewayHeaderOptions : AuthenticationSchemeOptions
{
    /// <summary>
    /// Nama skema autentikasi.
    /// </summary>
    public const string SchemeName = "GatewayHeader";

    /// <summary>
    /// Nama header yang diisi Nginx setelah <c>auth_request</c> ke layanan auth berhasil.
    /// </summary>
    public const string UserIdHeader = "X-User-Id";
}

/// <summary>
/// Handler autentikasi yang mempercayai header <c>X-User-Id</c> dari Nginx.
/// Kestrel hanya mendengarkan loopback, sehingga header dari luar tidak pernah sampai.
/// </summary>
public class GatewayHeaderHandler : AuthenticationHandler<GatewayHeaderOptions>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="GatewayHeaderHandler"/> class.
    /// </summary>
    /// <param name="options">Opsi skema.</param>
    /// <param name="logger">Pabrik logger.</param>
    /// <param name="encoder">Encoder URL.</param>
    public GatewayHeaderHandler(
        IOptionsMonitor<GatewayHeaderOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    /// <inheritdoc/>
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!this.Request.Headers.TryGetValue(GatewayHeaderOptions.UserIdHeader, out var userIdHeader)
            || string.IsNullOrWhiteSpace(userIdHeader))
        {
            return Task.FromResult(AuthenticateResult.Fail("Missing X-User-Id header"));
        }

        if (!Guid.TryParse(userIdHeader, out var userId))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid X-User-Id format"));
        }

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, GatewayHeaderOptions.SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, GatewayHeaderOptions.SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    /// <inheritdoc/>
    protected override async Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        this.Response.StatusCode = StatusCodes.Status401Unauthorized;
        this.Response.ContentType = "application/json";

        var payload = new { success = false, message = "Unauthorized" };

        await this.Response.WriteAsJsonAsync(payload);
    }
}
