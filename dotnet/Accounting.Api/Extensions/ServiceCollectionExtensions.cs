using Accounting.Api.DTOs;
using Accounting.Api.Services.AnalyticsQueue;
using Accounting.Api.Services.ChartOfAccounts;
using Accounting.Api.Services.Periods;
using Accounting.Api.Services.Reports.FinancialStatements;
using Accounting.Api.Services.Reports.GeneralLedgers;
using Accounting.Api.Services.Reports.Journals;
using Accounting.Api.Services.Reports.Summary;
using Accounting.Api.Services.Reports.TrialBalances;
using Accounting.Api.Services.Reports.Worksheet;
using Accounting.Api.Validators;
using Accounting.Api.Validators.ChartOfAccounts;
using Accounting.Api.Validators.Queries;
using FluentValidation;
using StackExchange.Redis;

namespace Microsoft.Extensions.DependencyInjection;

public static class ServiceCollectionExtensions
{
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

    public static IServiceCollection AddAnalyticsQueueServices(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConnectionString = configuration.GetConnectionString("Redis")
            ?? configuration["REDIS_URL"]
            ?? "localhost:6379";

        services.AddSingleton<IConnectionMultiplexer>(sp =>
            ConnectionMultiplexer.Connect(redisConnectionString));

        services.AddScoped<IAnalyticsQueueService, AnalyticsQueueService>();

        return services;
    }
}