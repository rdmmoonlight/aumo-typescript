using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Aumo.Accounting.Api.Authentication;

public class GatewayHeaderOptions : AuthenticationSchemeOptions
{
    public const string SchemeName = "GatewayHeader";
}

public class GatewayHeaderHandler : AuthenticationHandler<GatewayHeaderOptions>
{
    public GatewayHeaderHandler(
        IOptionsMonitor<GatewayHeaderOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Read X-User-Id header from request
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdHeader) || string.IsNullOrWhiteSpace(userIdHeader))
        {
            return Task.FromResult(AuthenticateResult.Fail("Missing X-User-Id header"));
        }

        // Convert string to Guid
        if (!Guid.TryParse(userIdHeader, out var userId))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid X-User-Id format"));
        }

        // Build ClaimsPrincipal with ClaimTypes.NameIdentifier
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    protected override async Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = StatusCodes.Status401Created;
        Response.ContentType = "application/json";

        var payload = new
        {
            success = false,
            message = "Unauthorized"
        };

        await Response.WriteAsJsonAsync(payload);
    }
}