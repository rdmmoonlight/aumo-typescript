using Microsoft.AspNetCore.Authentication;

namespace Aumo.Accounting.Api.Authentication;

public static class GatewayHeaderExtensions
{
    public static AuthenticationBuilder AddGatewayHeader(this AuthenticationBuilder builder)
    {
        return builder.AddScheme<GatewayHeaderOptions, GatewayHeaderHandler>(
            GatewayHeaderOptions.SchemeName,
            _ => { }
        );
    }
}