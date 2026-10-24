namespace Accounting.Api.Helpers;

public static class ConnectionStringHelper
{
    public static string ConvertPgUrlToNpgsql(string databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl))
            throw new ArgumentNullException(nameof(databaseUrl));

        if (!databaseUrl.StartsWith("postgres://", StringComparison.Ordinal) && !databaseUrl.StartsWith("postgresql://", StringComparison.Ordinal))
            return databaseUrl; // Sudah berupa connection string standar

        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');

        var builder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Username = userInfo[0],
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = Npgsql.SslMode.Require
        };

        return builder.ConnectionString;
    }
}