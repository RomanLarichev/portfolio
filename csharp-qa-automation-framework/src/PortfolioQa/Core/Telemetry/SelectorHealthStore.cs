using System.Collections.Concurrent;

namespace PortfolioQa.Core.Telemetry;

/// <summary>Thread-safe in-memory selector telemetry store.</summary>
public sealed class SelectorHealthStore
{
    private readonly ConcurrentBag<SelectorHealthRecord> _records = new();

    public void Add(SelectorHealthRecord record) => _records.Add(record);
    public IReadOnlyList<SelectorHealthRecord> GetAll() => _records.ToList();

    public FieldHealthStats GetFieldStats(string fieldName)
    {
        var records = _records.Where(r => string.Equals(r.FieldName, fieldName, StringComparison.OrdinalIgnoreCase)).ToList();
        if (records.Count == 0) return new FieldHealthStats { FieldName = fieldName, SuccessRate = 100 };

        var successful = records.Where(r => r.Success).ToList();
        return new FieldHealthStats
        {
            FieldName = fieldName,
            TotalAttempts = records.Count,
            SuccessCount = successful.Count,
            ErrorCount = records.Count - successful.Count,
            SuccessRate = successful.Count * 100.0 / records.Count,
            AverageResolveTimeMs = records.Average(r => r.ResolveTimeMs),
            FallbackUsedCount = records.Count(r => r.UsedFallback),
            BestSelector = successful.GroupBy(r => r.Selector).OrderByDescending(g => g.Count()).Select(g => g.Key).FirstOrDefault()
        };
    }
}
