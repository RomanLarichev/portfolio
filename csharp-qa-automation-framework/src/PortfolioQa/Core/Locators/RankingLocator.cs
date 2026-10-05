using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using PortfolioQa.Core.Discovery;
using PortfolioQa.Core.Telemetry;

namespace PortfolioQa.Core.Locators;

/// <summary>
/// Resolves an element through ranked selector strategies and records selector health.
/// The public edition intentionally keeps a compact strategy set.
/// </summary>
public sealed class RankingLocator
{
    private readonly IPage _page;
    private readonly ILogger<RankingLocator>? _logger;
    private readonly SelectorHealthMonitor? _health;

    public RankingLocator(IPage page, ILogger<RankingLocator>? logger = null, SelectorHealthMonitor? health = null)
    {
        _page = page;
        _logger = logger;
        _health = health;
    }

    public async Task<ILocator?> FindBestAsync(string fieldName)
    {
        var candidates = new List<LocatorCandidate>();
        AddAttribute(candidates, fieldName, "data-testid", 100);
        AddAttribute(candidates, fieldName, "data-qa", 95);
        await AddStableIdAsync(candidates, fieldName, 90);
        AddAttribute(candidates, fieldName, "aria-label", 80);
        AddAttribute(candidates, fieldName, "name", 70);
        AddAttribute(candidates, fieldName, "placeholder", 60);
        AddLabel(candidates, fieldName, 50);

        foreach (var candidate in candidates.OrderByDescending(x => x.Score))
        {
            var sw = Stopwatch.StartNew();
            var success = false;
            string? error = null;
            try
            {
                success = await candidate.Locator.CountAsync() > 0;
                if (success)
                {
                    _logger?.LogInformation("Resolved {Field} with {Strategy}", fieldName, candidate.Strategy);
                    return candidate.Locator.First;
                }
            }
            catch (Exception ex) { error = ex.Message; }
            finally
            {
                sw.Stop();
                _health?.RecordSelectorAttempt(fieldName, candidate.Selector, candidate.Strategy, success, sw.ElapsedMilliseconds, error);
            }
        }

        _health?.RecordSelectorAttempt(fieldName, "none", "fallback", false, 0, "No candidate found");
        return null;
    }

    private void AddAttribute(List<LocatorCandidate> list, string fieldName, string attribute, int score)
    {
        var value = Escape(fieldName);
        var selector = $"[{attribute}='{value}']";
        list.Add(new LocatorCandidate { Selector = selector, Strategy = attribute, Score = score, Locator = _page.Locator(selector) });
    }

    private async Task AddStableIdAsync(List<LocatorCandidate> list, string fieldName, int score)
    {
        var selector = $"#{Escape(fieldName)}";
        var locator = _page.Locator(selector);
        if (await locator.CountAsync() == 0) return;
        var id = await locator.First.GetAttributeAsync("id");
        if (!DynamicIdDetector.IsDynamic(id))
            list.Add(new LocatorCandidate { Selector = selector, Strategy = "stable-id", Score = score, Locator = locator });
    }

    private void AddLabel(List<LocatorCandidate> list, string fieldName, int score)
    {
        var label = _page.GetByLabel(fieldName, new PageGetByLabelOptions { Exact = true });
        list.Add(new LocatorCandidate { Selector = $"label={fieldName}", Strategy = "label", Score = score, Locator = label });
    }

    private static string Escape(string value) => value.Replace("\\", "\\\\").Replace("'", "\\'").Replace("\"", "\\\"");
}
