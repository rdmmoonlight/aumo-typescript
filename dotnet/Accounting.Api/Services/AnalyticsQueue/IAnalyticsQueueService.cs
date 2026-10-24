namespace Accounting.Api.Services.AnalyticsQueue;

public interface IAnalyticsQueueService
{
    Task EnqueueTransactionAsync(string transactionDate, decimal amount);
}