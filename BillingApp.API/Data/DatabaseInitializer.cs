using Dapper;

namespace BillingApp.API.Data;

public class DatabaseInitializer
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(IDbConnectionFactory connectionFactory, ILogger<DatabaseInitializer> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        try
        {
            // 1. Ensure Database Exists
            var builder = new Npgsql.NpgsqlConnectionStringBuilder(_connectionFactory.CreateConnection().ConnectionString);
            var originalDb = builder.Database;
            
            // Connect to 'postgres' to check/create db
            builder.Database = "postgres"; 
            using (var masterConnection = new Npgsql.NpgsqlConnection(builder.ToString()))
            {
                await masterConnection.OpenAsync();
                var exists = await masterConnection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = @db)", new { db = originalDb });
                
                if (!exists)
                {
                    _logger.LogInformation($"Database '{originalDb}' does not exist. Creating...");
                    await masterConnection.ExecuteAsync($"CREATE DATABASE \"{originalDb}\"");
                    _logger.LogInformation($"Database '{originalDb}' created.");
                }
            }

            // 2. Initialize Schema
            using var connection = _connectionFactory.CreateConnection();
            
            var sql = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Data", "init.sql"));
            
            _logger.LogInformation("Initializing database schema...");
            await connection.ExecuteAsync(sql);
            _logger.LogInformation("Database schema initialized successfully.");

            var userCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM \"Users\"");
            _logger.LogInformation($"Total users in database: {userCount}");
            
            if (userCount > 0)
            {
                var users = await connection.QueryAsync<dynamic>("SELECT \"Id\", \"Username\" FROM \"Users\"");
                foreach (var user in users)
                {
                    _logger.LogInformation($"Found User: ID={user.Id}, Username={user.Username}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initializing the database.");
            throw;
        }
    }
}
