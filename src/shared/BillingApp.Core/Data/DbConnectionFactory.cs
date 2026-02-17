using System.Data;
using Npgsql;
using Microsoft.Extensions.Configuration;

namespace BillingApp.Core.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration configuration)
    {
        // Check for DATABASE_URL (common in cloud environments like Render/Neon)
        var envConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrEmpty(envConnectionString))
        {
            Console.WriteLine($"[DbConnectionFactory] Found DATABASE_URL environment variable.");
            Console.WriteLine($"[DbConnectionFactory] Raw length: {envConnectionString.Length}");
            // Print first few chars to check scheme (DO NOT print full string for security)
            Console.WriteLine($"[DbConnectionFactory] StartsWith: {envConnectionString.Substring(0, Math.Min(20, envConnectionString.Length))}...");

            _connectionString = ParseDatabaseUrl(envConnectionString);
            
            // Log if parsing changed it
            if (_connectionString != envConnectionString)
            {
               Console.WriteLine("[DbConnectionFactory] Successfully parsed URL into Key-Value format.");
            }
            else
            {
               Console.WriteLine("[DbConnectionFactory] WARNING: URL parsing skipped or failed, using raw string.");
            }
        }
        else
        {
            Console.WriteLine("[DbConnectionFactory] DATABASE_URL not found, using DefaultConnection from appsettings.");
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }

    private string ParseDatabaseUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return url;
        
        var trimmedUrl = url.Trim();

        // Check for both postgres:// and postgresql:// schemes (Case Insensitive)
        bool isPostgres = trimmedUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase);
        bool isPostgresSql = trimmedUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

        if (!isPostgres && !isPostgresSql) 
        {
            Console.WriteLine($"[DbConnectionFactory] URL does not start with expected scheme. Scheme check failed.");
            return url;
        }

        try 
        {
            var uri = new Uri(trimmedUrl);
        var userInfo = uri.UserInfo.Split(':');
        var user = userInfo[0];
        // Handle password usually being the rest of the string after the first colon 
        // (though in simple user:pass cases, Split works. For robust decoding we rely on Uri but UserInfo is raw)
        var pass = userInfo.Length > 1 ? userInfo[1] : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={host};Port={port};Database={database};Username={user};Password={pass};SSL Mode=Require;Trust Server Certificate=true";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbConnectionFactory] Error parsing URL: {ex.Message}");
            return url;
        }
    }
}
