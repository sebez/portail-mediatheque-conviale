# Story 6.1: Backend ISBN Lookup Service — Open Library & Google Books Fallback Chain

Status: review

## Story

As the library admin system,
I want a backend service that looks up ISBN metadata from Open Library and falls back to Google Books,
So that the admin form can be auto-filled without exposing API keys to the browser and without blocking manual entry if both APIs fail.

## Acceptance Criteria

1. **Given** an authenticated admin calls `GET /api/isbn/{isbn}`, **when** Open Library returns full metadata within 5 seconds, **then** HTTP 200 is returned with an `IsbnLookupDto` containing title, author, genre, publicationYear, and coverImageUrl.

2. **Given** Open Library returns no data or times out after 5 seconds, **when** the fallback chain runs, **then** Google Books is called (5-second timeout) and its data is returned instead.

3. **Given** both Open Library and Google Books return no data or time out, **when** the fallback chain completes, **then** HTTP 200 is returned with an `IsbnLookupDto` where all fields are `null` except `isbn` — never an error response.

4. **Given** the Google Books API key, **when** `IsbnService` initializes, **then** the key is read from `IConfiguration` using key `GOOGLE_BOOKS_API_KEY` — never hardcoded in source.

5. **Given** the returned `coverImageUrl` from either API, **when** `IsbnService` processes the response, **then** an HTTP HEAD check validates the URL before including it in the response; if the cover URL is broken, `coverImageUrl` is returned as `null`.

6. **Given** `GET /api/isbn/{isbn}` is called without a valid JWT, **when** the backend processes the request, **then** HTTP 401 is returned.

## Tasks / Subtasks

- [x] Task 1: Create `IsbnLookupDto` (AC: #1, #2, #3)
  - [x] Create new file `backend/Models/DTOs/IsbnLookupDto.cs` — all fields nullable except `Isbn`
  - [x] Fields: `string Isbn`, `string? Title`, `string? Author`, `string? Genre`, `int? PublicationYear`, `string? CoverImageUrl`

- [x] Task 2: Update `IIsbnService` interface (AC: #1, #3)
  - [x] Modify `backend/Services/Interfaces/IIsbnService.cs` — change return type from `Task<BookDto?>` to `Task<IsbnLookupDto>` (never returns null — always returns at minimum `{ isbn: "..." }`)
  - [x] Add `using PortailMediatheque.Api.Models.DTOs;` if not present; remove `BookDto?` reference

- [x] Task 3: Implement `IsbnService` (AC: #1, #2, #3, #4, #5)
  - [x] Create `backend/Services/IsbnService.cs` implementing `IIsbnService`
  - [x] Inject `IHttpClientFactory` and `IConfiguration` via constructor
  - [x] Read `GOOGLE_BOOKS_API_KEY` from `IConfiguration` in constructor — store as nullable `string?`
  - [x] Implement `LookupAsync(string isbn)`: try Open Library (5s timeout) → if no data try Google Books (5s timeout) → return empty DTO on both failure — **never throw**
  - [x] Implement `LookupOpenLibraryAsync(string isbn)` — parse JSON, extract fields, validate cover URL
  - [x] Implement `LookupGoogleBooksAsync(string isbn)` — parse JSON, extract fields, validate cover URL
  - [x] Implement `ValidateCoverUrlAsync(string? url)` — HTTP HEAD check, 5s timeout, return null on failure
  - [x] Implement `ExtractYear(string? dateString)` — regex `\b(\d{4})\b` to extract 4-digit year from strings like "2019", "April 2019", "2019-01-15"
  - [x] Wrap each API call in try/catch — on any exception (timeout, parse error, network) → silently continue to next step

- [x] Task 4: Create `IsbnController` (AC: #1, #6)
  - [x] Create `backend/Controllers/IsbnController.cs`
  - [x] Route: `[Route("[controller]")]` → maps to `/isbn` (nginx strips `/api` prefix)
  - [x] `[ApiController]` + `[Authorize]` at controller level — ALL endpoints require JWT
  - [x] Inject `IIsbnService` via constructor
  - [x] `[HttpGet("{isbn}")] GetByIsbnAsync(string isbn)` → `return Ok(await _isbnService.LookupAsync(isbn))`

- [x] Task 5: Register `IsbnService` in DI (AC: #1)
  - [x] In `backend/Program.cs`, add `builder.Services.AddScoped<IIsbnService, IsbnService>();` after existing service registrations
  - [x] Note: `AddHttpClient()` is ALREADY registered — do NOT add it again

- [x] Task 6: Add `.env.example` note (AC: #4)
  - [x] Verify `GOOGLE_BOOKS_API_KEY=your-google-books-api-key` is already in `.env.example` — it is, no change needed

- [x] Task 7: Write xUnit tests (AC: all)
  - [x] Create `backend.Tests/Services/IsbnServiceTests.cs`
  - [x] Create `FakeIsbnHttpMessageHandler` that returns different responses based on URL pattern
  - [x] Test: `LookupAsync_OpenLibraryReturnsFullData_ReturnsFilledDto`
  - [x] Test: `LookupAsync_OpenLibraryEmpty_FallsBackToGoogleBooks_ReturnsGoogleData`
  - [x] Test: `LookupAsync_BothApisReturnEmpty_ReturnsIsbnOnlyDto`
  - [x] Test: `LookupAsync_BrokenCoverUrl_ReturnsCoverUrlNull`
  - [x] Test: `LookupAsync_OpenLibraryThrows_FallsBackToGoogleBooks`

- [x] Task 8: Validation
  - [x] `dotnet build` in `backend/` — 0 errors
  - [x] `dotnet test` in `backend.Tests/` — all tests pass (no regressions)
  - [ ] Manual: `GET /api/isbn/9780374275631` without JWT → 401
  - [ ] Manual: `GET /api/isbn/9780374275631` with JWT → 200 with metadata (or 200 with `isbn` only if OL/GB unavailable)

## Dev Notes

### Scope: 4 new files, 2 files modified

| Action | File | Notes |
|--------|------|-------|
| NEW | `backend/Models/DTOs/IsbnLookupDto.cs` | Minimal nullable DTO for lookup result |
| MODIFY | `backend/Services/Interfaces/IIsbnService.cs` | Change return type from `Task<BookDto?>` to `Task<IsbnLookupDto>` |
| NEW | `backend/Services/IsbnService.cs` | Full fallback chain implementation |
| NEW | `backend/Controllers/IsbnController.cs` | `[Authorize]` GET endpoint |
| MODIFY | `backend/Program.cs` | Add `AddScoped<IIsbnService, IsbnService>()` — one line only |
| NEW | `backend.Tests/Services/IsbnServiceTests.cs` | Unit tests with URL-aware fake handler |

No frontend changes in this story. No Angular files touched.

### What ALREADY EXISTS — DO NOT Recreate

| File | What's already there |
|------|----------------------|
| `backend/Services/Interfaces/IIsbnService.cs` | Interface with `LookupAsync` stub — MODIFY return type only |
| `frontend/src/app/shared/services/isbn.service.ts` | Angular placeholder service — **NO CHANGES in 6.1** (Stories 6.2/6.3) |
| `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts` | Placeholder component — **NO CHANGES in 6.1** (Story 6.2) |
| `.env.example` | `GOOGLE_BOOKS_API_KEY=your-google-books-api-key` already present — no change |
| `backend/Program.cs` | `AddHttpClient()` ALREADY registered at line 48 — never add again |
| `backend/Models/DTOs/BookDto.cs` | Full book DTO — do NOT use for ISBN lookup (it has non-nullable fields + irrelevant Id/DateAdded) |

### Task 1: `IsbnLookupDto` — Full Implementation

Create **new file** `backend/Models/DTOs/IsbnLookupDto.cs`:

```csharp
namespace PortailMediatheque.Api.Models.DTOs;

// Partial metadata returned by ISBN lookup — all fields nullable (Open Library or Google Books may return partial data)
// Never returned as null from IsbnService — always at minimum { isbn: "..." }
public class IsbnLookupDto
{
    public string Isbn { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Author { get; set; }
    public string? Genre { get; set; }
    public int? PublicationYear { get; set; }
    public string? CoverImageUrl { get; set; }
}
```

### Task 2: Update `IIsbnService`

Replace **entire content** of `backend/Services/Interfaces/IIsbnService.cs`:

```csharp
using PortailMediatheque.Api.Models.DTOs;

namespace PortailMediatheque.Api.Services.Interfaces;

// Open Library → Google Books fallback chain; NEVER throw on API failure; NEVER return null
public interface IIsbnService
{
    Task<IsbnLookupDto> LookupAsync(string isbn);
}
```

### Task 3: `IsbnService` — Full Implementation

Create **new file** `backend/Services/IsbnService.cs`:

```csharp
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
```

### Task 4: `IsbnController` — Full Implementation

Create **new file** `backend/Controllers/IsbnController.cs`:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Controllers;

[ApiController]
[Route("[controller]")]  // → /isbn  (nginx strips /api prefix; Angular dev calls :5000/isbn directly)
[Authorize]              // ALL endpoints require JWT — IsbnController is admin-only (FR27–FR33)
public class IsbnController : ControllerBase
{
    private readonly IIsbnService _isbnService;

    public IsbnController(IIsbnService isbnService)
    {
        _isbnService = isbnService;
    }

    // GET /isbn/{isbn}  →  200 with IsbnLookupDto (always — never 404 or 500 for API failures)
    [HttpGet("{isbn}")]
    public async Task<ActionResult<IsbnLookupDto>> GetByIsbnAsync(string isbn)
    {
        var result = await _isbnService.LookupAsync(isbn);
        return Ok(result);
    }
}
```

### Task 5: `Program.cs` — One-Line Addition

In `backend/Program.cs`, in the `# ─── Services ───` block (after line 46 `AddScoped<IAuthService>`), add:

```csharp
builder.Services.AddScoped<IIsbnService, IsbnService>();
```

The block should look like:
```csharp
// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIsbnService, IsbnService>();  // ← ADD THIS LINE
// ─── HTTP client factory (used by BookService for cover URL validation) ─────
builder.Services.AddHttpClient();
```

**CRITICAL: Do NOT add another `AddHttpClient()` — it is already there.**

### Task 7: `IsbnServiceTests` — Full Implementation

Create **new file** `backend.Tests/Services/IsbnServiceTests.cs`:

```csharp
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
        foreach (var (pattern, (status, content)) in responses)
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
```

**Note:** `FakeHttpClientFactory` already exists in `BookServiceTests.cs` as an `internal class`. Since it's `internal` in the same `backend.Tests` assembly, you can reuse it directly — no need to redeclare it. If the compiler complains about duplicate definition, remove the one in `IsbnServiceTests.cs` and use the existing one from `BookServiceTests.cs`.

### Architecture Compliance

- `IsbnController` uses `[Route("[controller]")]` → routes to `/isbn` (matches Angular `isbn.service.ts` calling `${environment.apiUrl}/isbn`)
- `[Authorize]` at controller level — never per-action (AC #6: FR27–FR33 all admin-only)
- Constructor injection (not `inject()`) — this is .NET; `inject()` is Angular only
- `IHttpClientFactory` → `CreateClient()` — never `new HttpClient()` directly
- `IConfiguration` for `GOOGLE_BOOKS_API_KEY` — never hardcoded
- All methods async, `Async` suffix — `LookupAsync` per naming convention
- Service registered as `AddScoped` — consistent with `BookService` and `AuthService`
- `IsbnService` in `backend/Services/` and interface in `backend/Services/Interfaces/` — matches project structure

### NFR Compliance

- **NFR10** (Open Library unavailability non-blocking): catch around OL call → falls to GB → form still submittable
- **NFR11** (Google Books unavailability non-blocking): catch around GB call → returns empty DTO → form still submittable
- **NFR12** (API key as env var): `_configuration["GOOGLE_BOOKS_API_KEY"]` — Docker Compose passes env var to container
- **NFR13** (cover URL validation): `ValidateCoverUrlAsync` with HEAD check before including URL in response
- **NFR4** (60-second add flow): 5s per API + 5s cover check = max 15s additional in worst case — total flow still under 60s

### External API Reference

**Open Library Books API:**
- URL: `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json`
- Found: `{ "ISBN:{isbn}": { "title": "...", "authors": [{"name": "..."}], "subjects": [{"name": "..."}], "publish_date": "...", "cover": {"large": "...", "medium": "..."} } }`
- Not found: `{}`  (empty JSON object)

**Google Books API:**
- URL: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key={key}`
- Found: `{ "totalItems": N, "items": [{ "volumeInfo": { "title", "authors": [], "categories": [], "publishedDate", "imageLinks": { "thumbnail": "..." } } }] }`
- Not found: `{ "totalItems": 0 }` (no `items` property)
- `publishedDate` format: `"2019"`, `"2019-01"`, `"2019-01-15"` → use regex `\b(\d{4})\b`
- Multiple authors: join with `", "` (Google Books returns string array, Open Library returns object array)

### Angular `isbn.service.ts` — No Changes in 6.1

The Angular service already calls the correct endpoint:
```typescript
private readonly apiUrl = `${environment.apiUrl}/isbn`;

lookup(isbn: string): Observable<Partial<Book>> {
  return this.http.get<Partial<Book>>(`${this.apiUrl}/${isbn}`);
}
```
`Partial<Book>` is compatible with `IsbnLookupDto` (all fields optional/nullable). The Angular service is fully wired — Stories 6.2 and 6.3 will use it.

### Critical Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| `new HttpClient()` | Always `_httpClientFactory.CreateClient()` |
| Hardcoding `"https://openlibrary.org"` or Google key | Use private const or config — key must come from `IConfiguration` |
| Throwing when API unavailable | Wrap in try/catch → return empty/partial DTO |
| Returning `null` from `LookupAsync` | Always return `new IsbnLookupDto { Isbn = isbn }` as fallback |
| Using `BookDto` for ISBN lookup response | Use `IsbnLookupDto` — `BookDto` has non-nullable fields incompatible with partial data |
| Adding `AddHttpClient()` again in `Program.cs` | Already registered at line 48 — duplicate causes no error but is misleading |
| `GET` returning 404 when APIs return no data | Always HTTP 200 — "not found in external API" is not a 404 (AC #3) |
| `result.Author = string.Join(", ", authors.EnumerateArray())` without null filter | Filter nulls: `.Select(a => a.GetString()).Where(a => a != null)` |

### Previous Story Intelligence

From Epic 5 stories (5.1–5.4, all in review):
- Constructor DI pattern: `public ServiceName(IDep1 dep1, IDep2 dep2)` — no `inject()` in backend
- `[Route("[controller]")]` maps controller name to route: `BooksController` → `/books`, `IsbnController` → `/isbn`
- `[Authorize]` at controller level covers all actions — confirmed working in `BooksController` for CRUD
- `AddScoped<IService, Service>()` registration in `Program.cs` — consistent pattern
- `IHttpClientFactory` already registered with `AddHttpClient()` — do NOT add again
- `_httpClientFactory.CreateClient()` → use the returned `HttpClient` for the request (BookService uses same pattern)
- xUnit tests: `FakeHttpMessageHandler` + `FakeHttpClientFactory` internal classes established in `BookServiceTests.cs`

### File Structure Notes

```
backend/
  Models/DTOs/
    IsbnLookupDto.cs          ← NEW
  Services/
    Interfaces/
      IIsbnService.cs         ← MODIFY (change return type to IsbnLookupDto)
    IsbnService.cs            ← NEW
  Controllers/
    IsbnController.cs         ← NEW
  Program.cs                  ← ADD 1 line

backend.Tests/
  Services/
    IsbnServiceTests.cs       ← NEW
```

No frontend files in this story. No EF migrations. No DB schema changes.

### References

- Epic 6 story 6.1 requirements: [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) (section "Story 6.1")
- Architecture (IsbnService, IsbnController, fallback chain): [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Existing `IIsbnService.cs` (to modify): [backend/Services/Interfaces/IIsbnService.cs](backend/Services/Interfaces/IIsbnService.cs)
- Angular `isbn.service.ts` (no change in 6.1): [frontend/src/app/shared/services/isbn.service.ts](frontend/src/app/shared/services/isbn.service.ts)
- `Program.cs` (add 1 line): [backend/Program.cs](backend/Program.cs)
- `BookServiceTests.cs` (FakeHttpClientFactory reuse): [backend.Tests/Services/BookServiceTests.cs](backend.Tests/Services/BookServiceTests.cs)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Created `IsbnLookupDto` with all nullable fields except `Isbn` (AC #1–#3)
- Updated `IIsbnService` interface: return type changed from `Task<BookDto?>` to `Task<IsbnLookupDto>` (AC #1, #3)
- Implemented `IsbnService` with full Open Library → Google Books fallback chain (AC #1–#5): 5s timeouts per API, `ValidateCoverUrlAsync` HEAD check, `ExtractYear` regex, all exceptions silently caught
- Created `IsbnController` with `[Authorize]` at controller level, `[Route("[controller]")]` → `/isbn` (AC #1, #6)
- Registered `IsbnService` as `AddScoped` in `Program.cs` — did NOT re-add `AddHttpClient()` (AC #1)
- Confirmed `GOOGLE_BOOKS_API_KEY` already in `.env.example` (AC #4)
- Created 5 xUnit tests using `FakeIsbnHttpMessageHandler` (URL-aware, longest-pattern-first matching) reusing `FakeHttpClientFactory` from `BookServiceTests.cs`
- Fixed `FakeIsbnHttpMessageHandler` to sort patterns by length descending — prevents `"openlibrary.org"` from matching before `"covers.openlibrary.org"` in the broken-cover test
- Build: 0 errors, 0 warnings; Tests: 44 passed, 0 failed (39 pre-existing + 5 new)

### File List

- `backend/Models/DTOs/IsbnLookupDto.cs` (NEW)
- `backend/Services/Interfaces/IIsbnService.cs` (MODIFIED — return type)
- `backend/Services/IsbnService.cs` (NEW)
- `backend/Controllers/IsbnController.cs` (NEW)
- `backend/Program.cs` (MODIFIED — added 1 line)
- `backend.Tests/Services/IsbnServiceTests.cs` (NEW)

### Change Log

- 2026-04-24: Story 6.1 created — Backend ISBN Lookup Service — Open Library & Google Books Fallback Chain
- 2026-04-25: Story 6.1 implemented — 4 new files, 2 modified; 5 tests added; 44/44 tests passing; status → review
