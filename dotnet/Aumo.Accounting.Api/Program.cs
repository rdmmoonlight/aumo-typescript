using Aumo.Accounting.Api.Authentication;

var builder = WebApplication.CreateBuilder(args);

// 1. Kestrel hanya mendengarkan 127.0.0.1:5100
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5100);
});

// 2. Registrasi Autentikasi GatewayHeader sebagai default scheme
builder.Services.AddAuthentication(options =>
{
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

// 3. Pastikan UseAuthentication dipasang SEBELUM UseAuthorization dan MapControllers
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();