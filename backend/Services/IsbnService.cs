using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Services;

public class IsbnService : IIsbnService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _googleBooksApiKey;

    public IsbnService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _googleBooksApiKey = configuration["GOOGLE_BOOKS_API_KEY"];
    }

    public async Task<IsbnLookupDto> LookupAsync(string isbn)
    {
        // Open Library first
        try
        {
            var olResult = await LookupOpenLibraryAsync(isbn);
            if (olResult.Title != null) return olResult;
        }
        catch { /* timeout or parse error — fall through to Google Books */ }

        // Google Books fallback
        try
        {
            var gbResult = await LookupGoogleBooksAsync(isbn);
            if (gbResult.Title != null) return gbResult;
        }
        catch { /* timeout or parse error — return empty DTO */ }

        // Both failed — return isbn-only DTO (AC #3: never an error, always 200)
        return new IsbnLookupDto { Isbn = isbn };
    }

    private async Task<IsbnLookupDto> LookupOpenLibraryAsync(string isbn)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var client = _httpClientFactory.CreateClient();
        var url = $"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json";
        var response = await client.GetStringAsync(url, cts.Token);

        using var doc = JsonDocument.Parse(response);
        var key = $"ISBN:{isbn}";
        if (!doc.RootElement.TryGetProperty(key, out var book))
            return new IsbnLookupDto { Isbn = isbn };

        var result = new IsbnLookupDto { Isbn = isbn };

        if (book.TryGetProperty("title", out var title))
            result.Title = title.GetString();

        if (book.TryGetProperty("authors", out var authors)
            && authors.ValueKind == JsonValueKind.Array
            && authors.GetArrayLength() > 0
            && authors[0].TryGetProperty("name", out var authorName))
            result.Author = authorName.GetString();

        if (book.TryGetProperty("subjects", out var subjects)
            && subjects.ValueKind == JsonValueKind.Array
            && subjects.GetArrayLength() > 0
            && subjects[0].TryGetProperty("name", out var subjectName))
            result.Genre = subjectName.GetString();

        if (book.TryGetProperty("publish_date", out var publishDate))
            result.PublicationYear = ExtractYear(publishDate.GetString());

        if (book.TryGetProperty("cover", out var cover))
        {
            string? coverUrl = null;
            if (cover.TryGetProperty("large", out var lg)) coverUrl = lg.GetString();
            else if (cover.TryGetProperty("medium", out var md)) coverUrl = md.GetString();
            result.CoverImageUrl = await ValidateCoverUrlAsync(coverUrl);
        }

        return result;
    }

    private async Task<IsbnLookupDto> LookupGoogleBooksAsync(string isbn)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var client = _httpClientFactory.CreateClient();
        var url = $"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={_googleBooksApiKey}";
        var response = await client.GetStringAsync(url, cts.Token);

        using var doc = JsonDocument.Parse(response);
        if (!doc.RootElement.TryGetProperty("items", out var items)
            || items.ValueKind != JsonValueKind.Array
            || items.GetArrayLength() == 0)
            return new IsbnLookupDto { Isbn = isbn };

        var volumeInfo = items[0].GetProperty("volumeInfo");
        var result = new IsbnLookupDto { Isbn = isbn };

        if (volumeInfo.TryGetProperty("title", out var title))
            result.Title = title.GetString();

        if (volumeInfo.TryGetProperty("authors", out var authors)
            && authors.ValueKind == JsonValueKind.Array
            && authors.GetArrayLength() > 0)
            result.Author = string.Join(", ",
                authors.EnumerateArray().Select(a => a.GetString()).Where(a => a != null));

        if (volumeInfo.TryGetProperty("categories", out var categories)
            && categories.ValueKind == JsonValueKind.Array
            && categories.GetArrayLength() > 0)
            result.Genre = categories[0].GetString();

        if (volumeInfo.TryGetProperty("publishedDate", out var publishedDate))
            result.PublicationYear = ExtractYear(publishedDate.GetString());

        if (volumeInfo.TryGetProperty("imageLinks", out var imageLinks)
            && imageLinks.TryGetProperty("thumbnail", out var thumbnail))
            result.CoverImageUrl = await ValidateCoverUrlAsync(thumbnail.GetString());

        return result;
    }

    private async Task<string?> ValidateCoverUrlAsync(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Head, url);
            var response = await client.SendAsync(request, cts.Token);
            return response.IsSuccessStatusCode ? url : null;
        }
        catch { return null; }
    }

    private static int? ExtractYear(string? dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString)) return null;
        var match = Regex.Match(dateString, @"\b(\d{4})\b");
        return match.Success && int.TryParse(match.Groups[1].Value, out var year) ? year : null;
    }
}
