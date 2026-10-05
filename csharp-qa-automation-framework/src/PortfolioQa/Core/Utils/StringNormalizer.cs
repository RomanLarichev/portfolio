using System.Text.RegularExpressions;

namespace PortfolioQa.Core.Utils;

public static class StringNormalizer
{
    public static string Normalize(string? input) => input?.ToLowerInvariant().Replace("ё", "е").Trim() ?? string.Empty;

    public static string SanitizeForMetadata(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var cleaned = input;
        cleaned = Regex.Replace(cleaned, @":(focus|hover|active|visited|link|focus-visible|focus-within)[\s,]*", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"::(before|after|placeholder)", "", RegexOptions.IgnoreCase);
        cleaned = Regex.Replace(cleaned, @"\.b2-[\w-]+\s*\{[^{}]*\}", "");
        cleaned = Regex.Replace(cleaned, @"\{[^{}]*\}", "");
        cleaned = Regex.Replace(cleaned, @"\s+", " ");
        cleaned = Regex.Replace(cleaned, @"[^\u0020-\u007E\u0400-\u04FF]", "");
        return cleaned.Length > 200 ? cleaned[..200].Trim() : cleaned.Trim();
    }

    public static bool IsGarbageText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return true;
        var value = text.Trim();
        if (value.Length == 1 && !char.IsLetterOrDigit(value[0])) return true;
        if (Regex.IsMatch(value, @"^[^\wа-яА-ЯёЁ]+$")) return true;
        if (value.Contains(".b2-") || value.Contains('{') || value.Contains('}')) return true;
        return value.Length > 200;
    }
}
