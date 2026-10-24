using Accounting.Api.DTOs;
using Accounting.Api.Services.Reports.Worksheet;
using Accounting.Api.Validators;
using Accounting.Api.Validators.ChartOfAccounts;
using Accounting.Api.Validators.Queries;
using FluentValidation;
using Accounting.Api.Services.Reports.Journals;
using Accounting.Api.Services.ChartOfAccounts;
using Accounting.Api.Services.Reports.GeneralLedgers;
using Accounting.Api.Services.Periods;
using Accounting.Api.Services.Reports.FinancialStatements;
using Accounting.Api.Services.Reports.Summary;
using Accounting.Api.Services.Reports.TrialBalances;

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

        services.AddScoped<IValidator<CreatePeriodRequest>, CreatePeriodRequestValidator>();
        services.AddScoped<IValidator<CreateAccountRequest>, CreateAccountRequestValidator>();
        services.AddScoped<IValidator<UpdateAccountRequest>, UpdateAccountRequestValidator>();
        services.AddScoped<IValidator<GetAccountsQuery>, GetAccountsQueryValidator>();

        return services;
    }
}
