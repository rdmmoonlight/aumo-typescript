using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Aumo.Accounting.Tests.Tests;

public class GatewayHeaderAuthTests : IClassFixture<AccountingApiFactory>
{
    private readonly HttpClient client;

    public GatewayHeaderAuthTests(AccountingApiFactory factory)
    {
        this.client = factory.CreateClient();
    }

    [Fact]
    public async Task GetSummary_WithoutXUserIdHeader_Returns401Unauthorized()
    {
        // Act: Request tanpa header X-User-Id
        var response = await this.client.GetAsync("/api/reports/summary");

        // Assert: Harus 401 Unauthorized
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(json.GetProperty("success").GetBoolean());
        Assert.Equal("Unauthorized", json.GetProperty("message").GetString());
    }

    [Fact]
    public async Task GetSummary_WithInvalidXUserIdHeader_Returns401Unauthorized()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/reports/summary");
        request.Headers.Add("X-User-Id", "invalid-guid-format");

        // Act
        var response = await this.client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(json.GetProperty("success").GetBoolean());
        Assert.Equal("Unauthorized", json.GetProperty("message").GetString());
    }

    [Fact]
    public async Task GetSummary_WithValidXUserIdHeader_Returns200OK()
    {
        // Arrange
        var validUserId = Guid.NewGuid().ToString();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/reports/summary");
        request.Headers.Add("X-User-Id", validUserId);

        // Act
        var response = await this.client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("success").GetBoolean());
        Assert.Equal(0, json.GetProperty("totalJournal").GetInt32());
        Assert.Equal(0, json.GetProperty("activeCoa").GetInt32());
        Assert.Equal("Tidak Ada Periode Aktif", json.GetProperty("activePeriodName").GetString());
        Assert.False(json.GetProperty("isPeriodOpen").GetBoolean());
    }
}