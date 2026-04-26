using System.Net;
using System.Text;
using Microsoft.Extensions.Configuration;
using PortailMediatheque.Api.Services;

namespace backend.Tests.Services;

public class IsbnServiceTests
{
    private static IsbnService CreateService(Dictionary<string, (HttpStatusCode, string?)> responses)
    {
        var handler = new FakeIsbnHttpMessageHandler(responses);
        var factory = new FakeHttpClientFactory(handler);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["GOOGLE_BOOKS_API_KEY"] = "test-key" })
            .Build();
        return new IsbnService(factory, config);
    }

    [Fact]
    public async Task LookupAsync_OpenLibraryReturnsFullData_ReturnsFilledDto()
    {
        const string olResponse = """
            {"ISBN:9780374275631":{"title":"Leaves of Grass","authors":[{"name":"Walt Whitman"}],
            "subjects":[{"name":"American poetry"}],"publish_date":"1990",
            "cover":{"large":"https://covers.openlibrary.org/b/id/1-L.jpg"}}}
            """;
        var service = CreateService(new()
        {
            ["openlibrary.org"] = (HttpStatusCode.OK, olResponse),
            ["covers.openlibrary.org"] = (HttpStatusCode.OK, null),
        });

        var result = await service.LookupAsync("9780374275631");

        Assert.Equal("9780374275631", result.Isbn);
        Assert.Equal("Leaves of Grass", result.Title);
        Assert.Equal("Walt Whitman", result.Author);
        Assert.Equal("American poetry", result.Genre);
        Assert.Equal(1990, result.PublicationYear);
        Assert.Equal("https://covers.openlibrary.org/b/id/1-L.jpg", result.CoverImageUrl);
    }

    [Fact]
    public async Task LookupAsync_OpenLibraryEmpty_FallsBackToGoogleBooks_ReturnsGoogleData()
    {
        const string olEmpty = "{}";
        const string gbResponse = """
            {"totalItems":1,"items":[{"volumeInfo":{"title":"Clean Code",
            "authors":["Robert C. Martin"],"categories":["Computers"],
            "publishedDate":"2008","imageLinks":{"thumbnail":"https://books.google.com/t.jpg"}}}]}
            """;
        var service = CreateService(new()
        {
            ["openlibrary.org"] = (HttpStatusCode.OK, olEmpty),
            ["googleapis.com"] = (HttpStatusCode.OK, gbResponse),
            ["books.google.com"] = (HttpStatusCode.OK, null),
        });

        var result = await service.LookupAsync("9780132350884");

        Assert.Equal("Clean Code", result.Title);
        Assert.Equal("Robert C. Martin", result.Author);
        Assert.Equal("Computers", result.Genre);
        Assert.Equal(2008, result.PublicationYear);
    }

    [Fact]
    public async Task LookupAsync_BothApisReturnEmpty_ReturnsIsbnOnlyDto()
    {
        var service = CreateService(new()
        {
            ["openlibrary.org"] = (HttpStatusCode.OK, "{}"),
            ["googleapis.com"] = (HttpStatusCode.OK, """{"totalItems":0}"""),
        });

        var result = await service.LookupAsync("0000000000");

        Assert.Equal("0000000000", result.Isbn);
        Assert.Null(result.Title);
        Assert.Null(result.Author);
        Assert.Null(result.CoverImageUrl);
    }

    [Fact]
    public async Task LookupAsync_BrokenCoverUrl_ReturnsCoverUrlNull()
    {
        const string olResponse = """
            {"ISBN:123":{"title":"A Book","cover":{"large":"https://covers.openlibrary.org/b/id/broken.jpg"}}}
            """;
        var service = CreateService(new()
        {
            ["openlibrary.org"] = (HttpStatusCode.OK, olResponse),
            ["covers.openlibrary.org"] = (HttpStatusCode.NotFound, null),
        });

        var result = await service.LookupAsync("123");

        Assert.Equal("A Book", result.Title);
        Assert.Null(result.CoverImageUrl);
    }

    [Fact]
    public async Task LookupAsync_OpenLibraryThrows_FallsBackToGoogleBooks()
    {
        const string gbResponse = """
            {"totalItems":1,"items":[{"volumeInfo":{"title":"Fallback Title"}}]}
            """;
        var service = CreateService(new()
        {
            ["openlibrary.org"] = (HttpStatusCode.ServiceUnavailable, null),
            ["googleapis.com"] = (HttpStatusCode.OK, gbResponse),
        });

        var result = await service.LookupAsync("9780000000000");

        Assert.Equal("Fallback Title", result.Title);
    }
}

internal class FakeIsbnHttpMessageHandler(
    Dictionary<string, (HttpStatusCode status, string? content)> responses) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var uri = request.RequestUri?.ToString() ?? "";
        // Match most specific (longest) pattern first to avoid "openlibrary.org" swallowing "covers.openlibrary.org"
        foreach (var (pattern, (status, content)) in responses.OrderByDescending(r => r.Key.Length))
        {
            if (uri.Contains(pattern))
            {
                var response = new HttpResponseMessage(status);
                if (content != null)
                    response.Content = new StringContent(content, Encoding.UTF8, "application/json");
                return Task.FromResult(response);
            }
        }
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
    }
}
