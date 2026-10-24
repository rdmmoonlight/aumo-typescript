using System;
using System.IO;
using System.Threading.Tasks;
using Accounting.Api.Data;
using Accounting.Api.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Accounting.Tests.IntegrationTests;

public class NeonSchemaReadTests
{
    private readonly string _connectionString;

    public NeonSchemaReadTests()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        var rawUrl = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DATABASE_URL"]
            ?? throw new InvalidOperationException("Connection string tidak ditemukan di appsettings.json atau environment variable.");

        _connectionString = ConnectionStringHelper.ConvertPgUrlToNpgsql(rawUrl);
    }

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CanRead_ChartOfAccounts_Table()
    {
        await using var db = CreateDbContext();
        var result = await db.ChartOfAccounts.AsNoTracking().FirstOrDefaultAsync();
        Assert.True(true);
    }

    [Fact]
    public async Task CanRead_GeneralJournal_Table()
    {
        await using var db = CreateDbContext();
        var result = await db.GeneralJournals.AsNoTracking().FirstOrDefaultAsync();
        Assert.True(true);
    }

    [Fact]
    public async Task CanRead_TransactionCounters_Table()
    {
        await using var db = CreateDbContext();
        var result = await db.TransactionCounters.AsNoTracking().FirstOrDefaultAsync();
        Assert.True(true);
    }
}