using FluentValidation;
using FluentValidation.AspNetCore;
using Aumo.Accounting.Api.Authentication;

var builder = WebApplication.CreateBuilder(args);

// Kestrel listening di 127.0.0.1:5100
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5100);
});

// Registrar Authentication & Authorization
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = GatewayHeaderOptions.SchemeName;
    options.DefaultChallengeScheme = GatewayHeaderOptions.SchemeName;
})
.AddGatewayHeader();

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// Register FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Class partial agar bisa diakses oleh WebApplicationFactory di project Test
public partial class Program { }