using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Accounting.Api.Authentication;

public class GatewayHeaderOptions : AuthenticationSchemeOptions
{
    public const string SchemeName = "GatewayHeader";
    public const string UserIdHeader = "X-User-Id";
    public static readonly HashSet<string> PublicPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health",
        "/reference",
        "/openapi/v1.json",
        "/openapi/v1.yaml",
    };
}

public class GatewayHeaderHandler : AuthenticationHandler<GatewayHeaderOptions>
{
    public GatewayHeaderHandler(
        IOptionsMonitor<GatewayHeaderOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Bypass rute publik agar tidak menghasilkan AuthenticateResult.Fail jika header X-User-Id absen
        if (GatewayHeaderOptions.PublicPaths.Contains(this.Request.Path.Value ?? string.Empty))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

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

        var payload = new
        {
            success = false,
            message = "Unauthorized",
            error = "Missing or invalid gateway authentication header",
        };

        await this.Response.WriteAsJsonAsync(payload);
    }
}