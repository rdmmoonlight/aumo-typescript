using Aumo.Accounting.Api.Services.Reports.Worksheet;
using Aumo.Accounting.Api.Services.Reports.Journals;
using Aumo.Accounting.Api.Services.ChartOfAccounts;
using Aumo.Accounting.Api.Services.Reports.GeneralLedgers;
using Aumo.Accounting.Api.Services.Periods;
using Aumo.Accounting.Api.Services.Reports.FinancialStatements;
using Aumo.Accounting.Api.Services.Reports.Summary;
using Aumo.Accounting.Api.Services.Reports.TrialBalances;

namespace Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Provides extension methods for registering accounting domain services into the dependency injection container.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers all core accounting application services to the specified <see cref="IServiceCollection"/>.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <returns>The updated <see cref="IServiceCollection"/>.</returns>
    public static IServiceCollection AddAccountingServices(this IServiceCollection services)
    {
        services.AddScoped<IChartOfAccountsService, ChartOfAccountsService>();
        services.AddScoped<IPeriodsService, PeriodsService>();
        services.AddScoped<IFinancialStatementsService, FinancialStatementsService>();
        services.AddScoped<IGeneralLedgersService, GeneralLedgersService>();
        services.AddScoped<IJournalsService, JournalsService>();
        services.AddScoped<ITransactionNumberService, TransactionNumberService>();
        services.AddScoped<ISummaryService, SummaryService>();
        services.AddScoped<ITrialBalanceService, TrialBalanceService>();
        services.AddScoped<IWorksheetService, WorksheetService>();

        return services;
    }
}
