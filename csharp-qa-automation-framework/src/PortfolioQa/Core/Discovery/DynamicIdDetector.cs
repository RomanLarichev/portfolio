using System.Text.RegularExpressions;

namespace PortfolioQa.Core.Discovery;

/// <summary>
/// Detects unstable DOM ids that should not be persisted as primary selectors.
/// Adapted from the private framework's metadata-discovery layer.
/// </summary>
public static class DynamicIdDetector
{
    private static readonly Regex[] DynamicPatterns =
    [
        new(@"^ant-blazor-[a-f0-9-]+$", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"^[a-f0-9]{16,}$", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"^_[a-f0-9]+$", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"^blazor_[a-f0-9]+$", RegexOptions.IgnoreCase | RegexOptions.Compiled)
    ];

    public static bool IsDynamic(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return false;
        return DynamicPatterns.Any(pattern => pattern.IsMatch(id));
    }

    public static bool IsStable(string? id) => !IsDynamic(id);
}
