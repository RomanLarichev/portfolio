namespace PortfolioQa.Core.Telemetry;

public sealed class SelectorHealthRecord
{
    public string FieldName { get; init; } = string.Empty;
    public string Selector { get; init; } = string.Empty;
    public string Strategy { get; init; } = string.Empty;
    public bool Success { get; init; }
    public long ResolveTimeMs { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public string? ErrorMessage { get; init; }
    public bool UsedFallback { get; init; }
}

public sealed class FieldHealthStats
{
    public string FieldName { get; init; } = string.Empty;
    public int TotalAttempts { get; init; }
    public int SuccessCount { get; init; }
    public int ErrorCount { get; init; }
    public double SuccessRate { get; init; }
    public double AverageResolveTimeMs { get; init; }
    public int FallbackUsedCount { get; init; }
    public string? BestSelector { get; init; }
}
