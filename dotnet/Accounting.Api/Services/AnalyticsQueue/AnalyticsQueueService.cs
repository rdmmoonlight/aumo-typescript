using System.Text.Json;
using StackExchange.Redis;

namespace Accounting.Api.Services.AnalyticsQueue;

public class AnalyticsQueueService : IAnalyticsQueueService
{
    private readonly IDatabase _redisDb;

    public AnalyticsQueueService(IConnectionMultiplexer redis)
    {
        _redisDb = redis.GetDatabase();
    }

    public async Task EnqueueTransactionAsync(string date, decimal amount)
    {
        var jobId = Guid.NewGuid().ToString("N");

        // Payload JSON disesuaikan dengan Struct JobPayload di Rust
        var payload = new
        {
            id = jobId,
            name = "transaction-analytics",
            data = new
            {
                date = date, // Format "YYYY-MM-DD"
                amount = (double)amount
            }
        };

        string jsonPayload = JsonSerializer.Serialize(payload);

        // Push ke Redis list BullMQ yang dibaca oleh Rust (bull:default:wait)
        await _redisDb.ListLeftPushAsync("bull:default:wait", jsonPayload);
    }
}