using System.Data;
using System.Globalization;
using Microsoft.Data.Sqlite;
using Npgsql;
using NpgsqlTypes;
using static SqlNames;

internal static class Program
{
    private static async Task<int> Main(string[] args)
    {
        var options = MigrationOptions.Parse(args);
        if (options.ShowHelp)
        {
            MigrationOptions.PrintHelp();
            return 0;
        }

        if (string.IsNullOrWhiteSpace(options.SqlitePath))
        {
            Console.Error.WriteLine("Missing SQLite path. Pass --sqlite <path> or set SQLITE_PATH.");
            return 1;
        }

        if (!File.Exists(options.SqlitePath))
        {
            Console.Error.WriteLine($"SQLite database not found: {options.SqlitePath}");
            return 1;
        }

        if (string.IsNullOrWhiteSpace(options.PostgresConnectionString))
        {
            Console.Error.WriteLine("Missing Postgres connection string. Pass --postgres <connection-string> or set CONNECTION_STRING / ConnectionStrings__Default.");
            return 1;
        }

        await using var sqlite = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = options.SqlitePath, Mode = SqliteOpenMode.ReadOnly }.ToString());
        await using var postgres = new NpgsqlConnection(options.PostgresConnectionString);
        await sqlite.OpenAsync();
        await postgres.OpenAsync();

        var sqliteTables = await DatabaseMetadata.LoadSqliteTables(sqlite);
        var postgresTables = await DatabaseMetadata.LoadPostgresSchema(postgres);

        var migration = new SqliteToPostgresMigration(sqlite, postgres, sqliteTables, postgresTables, options);
        await migration.Run();
        return 0;
    }
}

internal sealed class SqliteToPostgresMigration(
    SqliteConnection sqlite,
    NpgsqlConnection postgres,
    HashSet<string> sqliteTables,
    Dictionary<string, List<PostgresColumn>> postgresTables,
    MigrationOptions options)
{
    private static readonly string[] OrderedTables =
    [
        "daily_analytics",
        "system_alerts",
        "upload_domains",
        "users",
        "verificationtokens",
        "accounts",
        "api_keys",
        "uploads",
        "user_settings",
        "bio_links",
        "bio_views",
        "sessions",
        "short_links",
        "system_events",
        "download_logs",
        "view_logs"
    ];

    private static readonly HashSet<string> NullableOnEmptyString = new(StringComparer.OrdinalIgnoreCase)
    {
        "users.approvedById",
        "uploads.userId",
        "short_links.userId",
        "system_events.userId",
        "user_settings.uploadDomainId",
        "user_settings.bioUsername"
    };

    private readonly List<(string Id, object? ApprovedById)> deferredUserApprovals = [];

    public async Task Run()
    {
        await PrintPlan();

        if (options.DryRun)
        {
            Console.WriteLine("Dry run only; no Postgres data was changed.");
            return;
        }

        if (options.ClearDestination)
        {
            await ClearDestination();
        }

        await using var transaction = await postgres.BeginTransactionAsync();

        try
        {
            foreach (var table in OrderedTables)
            {
                if (!sqliteTables.Contains(table))
                {
                    Console.WriteLine($"Skipping {table}: source table does not exist.");
                    continue;
                }

                if (!postgresTables.TryGetValue(table, out var columns))
                {
                    Console.WriteLine($"Skipping {table}: destination table does not exist.");
                    continue;
                }

                await CopyTable(table, columns, transaction);

                if (table.Equals("users", StringComparison.OrdinalIgnoreCase))
                {
                    await RestoreUserApprovalLinks(transaction);
                }
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task PrintPlan()
    {
        Console.WriteLine($"SQLite:  {Path.GetFullPath(options.SqlitePath!)}");
        Console.WriteLine($"Mode:    {(options.DryRun ? "dry-run" : options.ClearDestination ? "clear destination, then import" : "append, skipping conflicts")}");
        Console.WriteLine();

        foreach (var table in OrderedTables)
        {
            if (!sqliteTables.Contains(table) || !postgresTables.ContainsKey(table))
            {
                continue;
            }

            await using var command = sqlite.CreateCommand();
            command.CommandText = $"SELECT COUNT(*) FROM {QuoteSqliteIdentifier(table)}";
            var count = Convert.ToInt64(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
            Console.WriteLine($"{table}: {count:N0} source rows");
        }

        Console.WriteLine();
    }

    private async Task ClearDestination()
    {
        var tables = OrderedTables.Where(postgresTables.ContainsKey).Select(QuotePostgresIdentifier);
        var sql = $"TRUNCATE TABLE {string.Join(", ", tables)} RESTART IDENTITY CASCADE;";
        await using var command = postgres.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync();
        Console.WriteLine("Cleared destination tables.");
    }

    private async Task CopyTable(string table, List<PostgresColumn> destinationColumns, NpgsqlTransaction transaction)
    {
        var sourceColumns = await LoadSqliteColumns(table);
        var imported = 0;
        var skipped = 0;

        await using var select = sqlite.CreateCommand();
        select.CommandText = $"SELECT * FROM {QuoteSqliteIdentifier(table)}";

        await using var reader = await select.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var values = BuildValues(table, destinationColumns, sourceColumns, reader);
            var inserted = await InsertRow(table, destinationColumns, values, transaction);
            if (inserted)
            {
                imported++;
            }
            else
            {
                skipped++;
            }

            if ((imported + skipped) % options.BatchLogInterval == 0)
            {
                Console.WriteLine($"{table}: {imported:N0} inserted, {skipped:N0} skipped...");
            }
        }

        Console.WriteLine($"{table}: {imported:N0} inserted, {skipped:N0} skipped.");
    }

    private async Task<Dictionary<string, string>> LoadSqliteColumns(string table)
    {
        var columns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        await using var command = sqlite.CreateCommand();
        command.CommandText = $"PRAGMA table_info({QuoteSqliteIdentifier(table)})";

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var name = reader.GetString(reader.GetOrdinal("name"));
            columns[name] = name;
        }

        return columns;
    }

    private Dictionary<string, object?> BuildValues(
        string table,
        List<PostgresColumn> destinationColumns,
        Dictionary<string, string> sourceColumns,
        SqliteDataReader reader)
    {
        var values = new Dictionary<string, object?>(StringComparer.Ordinal);

        foreach (var destinationColumn in destinationColumns)
        {
            object? value;
            var key = $"{table}.{destinationColumn.Name}";

            if (table.Equals("users", StringComparison.OrdinalIgnoreCase) &&
                destinationColumn.Name.Equals("approvedById", StringComparison.OrdinalIgnoreCase))
            {
                value = null;
            }
            else if (sourceColumns.TryGetValue(destinationColumn.Name, out var sourceColumn))
            {
                var ordinal = reader.GetOrdinal(sourceColumn);
                value = reader.IsDBNull(ordinal) ? null : reader.GetValue(ordinal);
            }
            else
            {
                value = DefaultValue(table, destinationColumn);
            }

            value = NormalizeValue(key, value);

            if (table.Equals("users", StringComparison.OrdinalIgnoreCase) &&
                destinationColumn.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) &&
                value is not null &&
                sourceColumns.TryGetValue("approvedById", out var approvedByColumn))
            {
                var ordinal = reader.GetOrdinal(approvedByColumn);
                var approvedById = reader.IsDBNull(ordinal) ? null : NormalizeValue("users.approvedById", reader.GetValue(ordinal));
                if (approvedById is not null)
                {
                    deferredUserApprovals.Add((Convert.ToString(value, CultureInfo.InvariantCulture)!, approvedById));
                }
            }

            values[destinationColumn.Name] = ConvertForPostgres(destinationColumn, value);
        }

        return values;
    }

    private static object? NormalizeValue(string key, object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is string text && text.Length == 0 && NullableOnEmptyString.Contains(key))
        {
            return null;
        }

        return value;
    }

    private static object? ConvertForPostgres(PostgresColumn column, object? value)
    {
        if (value is null)
        {
            return null;
        }

        return column.DataType switch
        {
            "boolean" => ToBoolean(value),
            "integer" => Convert.ToInt32(value, CultureInfo.InvariantCulture),
            "bigint" => Convert.ToInt64(value, CultureInfo.InvariantCulture),
            "double precision" => Convert.ToDouble(value, CultureInfo.InvariantCulture),
            "timestamp with time zone" => ToDateTimeOffset(value),
            "jsonb" => ToJsonText(value),
            _ => value is byte[] bytes ? Convert.ToBase64String(bytes) : Convert.ToString(value, CultureInfo.InvariantCulture)
        };
    }

    private static bool ToBoolean(object value) => value switch
    {
        bool boolean => boolean,
        byte numeric => numeric != 0,
        short numeric => numeric != 0,
        int numeric => numeric != 0,
        long numeric => numeric != 0,
        string text when bool.TryParse(text, out var parsed) => parsed,
        string text when long.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) => parsed != 0,
        _ => Convert.ToBoolean(value, CultureInfo.InvariantCulture)
    };

    private static DateTimeOffset ToDateTimeOffset(object value)
    {
        if (value is DateTimeOffset dto)
        {
            return dto.ToUniversalTime();
        }

        if (value is DateTime dateTime)
        {
            return new DateTimeOffset(DateTime.SpecifyKind(dateTime, DateTimeKind.Utc));
        }

        if (value is long unix)
        {
            return unix > 10_000_000_000
                ? DateTimeOffset.FromUnixTimeMilliseconds(unix)
                : DateTimeOffset.FromUnixTimeSeconds(unix);
        }

        var text = Convert.ToString(value, CultureInfo.InvariantCulture);
        if (string.IsNullOrWhiteSpace(text))
        {
            return DateTimeOffset.UtcNow;
        }

        if (long.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var unixText))
        {
            return ToDateTimeOffset(unixText);
        }

        return DateTimeOffset.Parse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
    }

    private static string ToJsonText(object value)
    {
        var text = Convert.ToString(value, CultureInfo.InvariantCulture);
        return string.IsNullOrWhiteSpace(text) ? "{}" : text;
    }

    private async Task<bool> InsertRow(
        string table,
        List<PostgresColumn> columns,
        Dictionary<string, object?> values,
        NpgsqlTransaction transaction)
    {
        await using var command = postgres.CreateCommand();
        command.Transaction = transaction;

        var quotedColumns = columns.Select(column => QuotePostgresIdentifier(column.Name));
        var parameters = columns.Select((_, index) => $"@p{index}");
        command.CommandText = $"""
            INSERT INTO {QuotePostgresIdentifier(table)}
                ({string.Join(", ", quotedColumns)})
            VALUES
                ({string.Join(", ", parameters)})
            ON CONFLICT DO NOTHING;
            """;

        for (var index = 0; index < columns.Count; index++)
        {
            var column = columns[index];
            var parameter = command.Parameters.AddWithValue($"p{index}", values[column.Name] ?? DBNull.Value);
            if (column.DataType.Equals("jsonb", StringComparison.OrdinalIgnoreCase))
            {
                parameter.NpgsqlDbType = NpgsqlDbType.Jsonb;
            }
        }

        return await command.ExecuteNonQueryAsync() > 0;
    }

    private async Task RestoreUserApprovalLinks(NpgsqlTransaction transaction)
    {
        if (deferredUserApprovals.Count == 0)
        {
            return;
        }

        var restored = 0;
        foreach (var (id, approvedById) in deferredUserApprovals)
        {
            await using var command = postgres.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = """
                UPDATE "users"
                SET "approvedById" = @approvedById
                WHERE "Id" = @id
                  AND EXISTS (SELECT 1 FROM "users" approver WHERE approver."Id" = @approvedById);
                """;
            command.Parameters.AddWithValue("id", id);
            command.Parameters.AddWithValue("approvedById", approvedById ?? DBNull.Value);
            restored += await command.ExecuteNonQueryAsync();
        }

        Console.WriteLine($"users: restored {restored:N0} approval links.");
    }

    private static object? DefaultValue(string table, PostgresColumn column)
    {
        if (column.IsNullable)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var key = $"{table}.{column.Name}";
        return key switch
        {
            "users.isApproved" => false,
            "users.isAdmin" => false,
            "api_keys.isActive" => true,
            "bio_links.isActive" => true,
            "system_alerts.isActive" => true,
            "system_alerts.notifyAdmins" => true,
            "system_alerts.notifyUser" => false,
            "upload_domains.isActive" => true,
            "upload_domains.isDefault" => false,
            "upload_domains.supportsSubdomains" => false,
            "user_settings.maxUploads" => 100,
            "user_settings.maxFileSize" => 10_485_760L,
            "user_settings.storageUsed" => 0L,
            "user_settings.maxShortLinks" => 500,
            "user_settings.ShowFileInfo" => true,
            "user_settings.ShowUploadDate" => true,
            "user_settings.ShowUserStats" => false,
            "user_settings.UseCustomWords" => false,
            "user_settings.BioIsPublic" => false,
            "user_settings.BioViews" => 0,
            "user_settings.BioShowDiscord" => false,
            "bio_links.Clicks" => 0,
            "short_links.Clicks" => 0,
            "uploads.Views" => 0,
            "uploads.Downloads" => 0,
            "daily_analytics.totalViews" => 0,
            "daily_analytics.uniqueViews" => 0,
            "daily_analytics.totalDownloads" => 0,
            "daily_analytics.uniqueDownloads" => 0,
            "daily_analytics.uploadsCount" => 0,
            "daily_analytics.usersRegistered" => 0,
            "system_alerts.cooldownMinutes" => 60,
            _ when column.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) => Guid.NewGuid().ToString("N"),
            _ when column.Name.Equals("createdAt", StringComparison.OrdinalIgnoreCase) => now,
            _ when column.Name.Equals("CreatedAt", StringComparison.OrdinalIgnoreCase) => now,
            _ when column.Name.Equals("updatedAt", StringComparison.OrdinalIgnoreCase) => now,
            _ when column.Name.Equals("UpdatedAt", StringComparison.OrdinalIgnoreCase) => now,
            _ when column.Name.Equals("Date", StringComparison.OrdinalIgnoreCase) => now.Date,
            _ when column.DataType.Equals("boolean", StringComparison.OrdinalIgnoreCase) => false,
            _ when column.DataType is "integer" or "bigint" => 0,
            _ when column.DataType.Equals("double precision", StringComparison.OrdinalIgnoreCase) => 0d,
            _ when column.DataType.Equals("timestamp with time zone", StringComparison.OrdinalIgnoreCase) => now,
            _ when column.DataType.Equals("jsonb", StringComparison.OrdinalIgnoreCase) => "{}",
            _ => string.Empty
        };
    }
}

internal sealed record PostgresColumn(string Name, string DataType, bool IsNullable);

internal sealed class MigrationOptions
{
    public string? SqlitePath { get; private init; }
    public string? PostgresConnectionString { get; private init; }
    public bool ClearDestination { get; private init; }
    public bool DryRun { get; private init; }
    public bool ShowHelp { get; private init; }
    public int BatchLogInterval { get; private init; } = 1_000;

    public static MigrationOptions Parse(string[] args)
    {
        var options = new MigrationOptions
        {
            SqlitePath = Environment.GetEnvironmentVariable("SQLITE_PATH"),
            PostgresConnectionString =
                Environment.GetEnvironmentVariable("CONNECTION_STRING") ??
                Environment.GetEnvironmentVariable("ConnectionStrings__Default")
        };

        for (var index = 0; index < args.Length; index++)
        {
            var arg = args[index];
            switch (arg)
            {
                case "--sqlite":
                    options = options.WithValue(sqlitePath: NextValue(args, ref index, arg));
                    break;
                case "--postgres":
                    options = options.WithValue(postgresConnectionString: NextValue(args, ref index, arg));
                    break;
                case "--clear":
                    options = options.WithValue(clearDestination: true);
                    break;
                case "--dry-run":
                    options = options.WithValue(dryRun: true);
                    break;
                case "--batch-log-interval":
                    options = options.WithValue(batchLogInterval: int.Parse(NextValue(args, ref index, arg), CultureInfo.InvariantCulture));
                    break;
                case "--help":
                case "-h":
                    options = options.WithValue(showHelp: true);
                    break;
                default:
                    throw new ArgumentException($"Unknown argument: {arg}");
            }
        }

        return options;
    }

    public static void PrintHelp()
    {
        Console.WriteLine("""
            Migrates the old Prisma SQLite database into the new PostgreSQL schema.

            Usage:
              dotnet run --project backend/TwinkForSale.Migrator -- --sqlite <dev.db> --postgres "<connection-string>" [--clear] [--dry-run]

            Options:
              --sqlite <path>              Path to the old SQLite database. Can also use SQLITE_PATH.
              --postgres <connection>      PostgreSQL connection string. Can also use CONNECTION_STRING or ConnectionStrings__Default.
              --clear                      Truncate destination tables before import.
              --dry-run                    Print source table counts without changing Postgres.
              --batch-log-interval <n>     Progress interval. Default: 1000.
            """);
    }

    private static string NextValue(string[] args, ref int index, string option)
    {
        if (index + 1 >= args.Length)
        {
            throw new ArgumentException($"Missing value for {option}.");
        }

        index++;
        return args[index];
    }

    private MigrationOptions WithValue(
        string? sqlitePath = null,
        string? postgresConnectionString = null,
        bool? clearDestination = null,
        bool? dryRun = null,
        bool? showHelp = null,
        int? batchLogInterval = null) => new()
        {
            SqlitePath = sqlitePath ?? SqlitePath,
            PostgresConnectionString = postgresConnectionString ?? PostgresConnectionString,
            ClearDestination = clearDestination ?? ClearDestination,
            DryRun = dryRun ?? DryRun,
            ShowHelp = showHelp ?? ShowHelp,
            BatchLogInterval = batchLogInterval ?? BatchLogInterval
        };
}

internal static class DatabaseMetadata
{
    public static async Task<HashSet<string>> LoadSqliteTables(SqliteConnection sqlite)
    {
        var tables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var command = sqlite.CreateCommand();
        command.CommandText = """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name NOT LIKE 'sqlite_%'
              AND name <> '_prisma_migrations';
            """;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        return tables;
    }

    public static async Task<Dictionary<string, List<PostgresColumn>>> LoadPostgresSchema(NpgsqlConnection postgres)
    {
        var tables = new Dictionary<string, List<PostgresColumn>>(StringComparer.OrdinalIgnoreCase);
        await using var command = postgres.CreateCommand();
        command.CommandText = """
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
            """;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var table = reader.GetString(0);
            var column = new PostgresColumn(
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3).Equals("YES", StringComparison.OrdinalIgnoreCase));

            if (!tables.TryGetValue(table, out var columns))
            {
                columns = [];
                tables[table] = columns;
            }

            columns.Add(column);
        }

        return tables;
    }
}

internal static class SqlNames
{
    public static string QuoteSqliteIdentifier(string identifier) => "\"" + identifier.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
    public static string QuotePostgresIdentifier(string identifier) => "\"" + identifier.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
}
