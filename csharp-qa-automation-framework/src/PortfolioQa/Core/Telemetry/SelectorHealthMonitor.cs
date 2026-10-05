using Microsoft.Extensions.Logging;

namespace PortfolioQa.Core.Telemetry;

public sealed class SelectorHealthMonitor
{
    private readonly SelectorHealthStore _store;
    private readonly ILogger<SelectorHealthMonitor>? _logger;

    public SelectorHealthMonitor(SelectorHealthStore store, ILogger<SelectorHealthMonitor>? logger = null)
    {
        _store = store;
        _logger = logger;
    }

    public void RecordSelectorAttempt(string fieldName, string selector, string strategy, bool success, long elapsedMs, string? error = null)
    {
        _store.Add(new SelectorHealthRecord
        {
            FieldName = fieldName,
            Selector = selector,
            Strategy = strategy,
            Success = success,
            ResolveTimeMs = elapsedMs,
            ErrorMessage = error,
            UsedFallback = strategy == "fallback"
        });
        _logger?.LogDebug("Selector {Strategy} for {FieldName}: {Result} ({Elapsed} ms)", strategy, fieldName, success, elapsedMs);
    }
}
