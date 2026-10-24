using System.Net;
using Microsoft.EntityFrameworkCore;
using Accounting.Api.Data;
using Accounting.Api.Authentication;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Listen(IPAddress.Parse("127.0.0.1"), 5100);
});

// Cukup InMemory buat lolosin tes auth Fase 4
builder.Services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase("aumo-fase4"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = GatewayHeaderOptions.SchemeName;
    options.DefaultAuthenticateScheme = GatewayHeaderOptions.SchemeName;
    options.DefaultChallengeScheme = GatewayHeaderOptions.SchemeName;
})
.AddGatewayHeader();

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddAccountingServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();