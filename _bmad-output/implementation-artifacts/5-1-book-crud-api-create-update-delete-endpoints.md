# Story 5.1: Book CRUD API — Create, Update, Delete Endpoints

Status: review

## Story

As the library admin system,
I want authenticated API endpoints to create, update, and delete books,
so that the admin frontend can perform full book management.

## Acceptance Criteria

1. **Given** an authenticated admin calls `POST /api/books` with a valid `CreateBookRequest`, **when** the backend processes the request, **then** HTTP 201 is returned with the created `BookDto` and a `Location` header pointing to `/api/books/{id}`, `DateAdded` is automatically set to the current UTC datetime, and `Status` defaults to `"available"`.

2. **Given** the `CoverImageUrl` field is provided in a `CreateBookRequest`, **when** the backend processes the request, **then** an HTTP HEAD check is performed on the URL before storage, and if the URL returns a non-2xx response, `CoverImageUrl` is stored as `null` rather than the broken URL.

3. **Given** an authenticated admin calls `PUT /api/books/{id}` with an `UpdateBookRequest`, **when** the book exists, **then** HTTP 200 is returned with the updated `BookDto`.

4. **Given** `PUT /api/books/{id}` is called for a non-existent id, **when** the backend processes the request, **then** HTTP 404 with a ProblemDetails body is returned.

5. **Given** an authenticated admin calls `DELETE /api/books/{id}`, **when** the book exists, **then** HTTP 204 (no body) is returned and the book is removed from the database.

6. **Given** any of these endpoints is called without a valid JWT, **when** the request is processed, **then** HTTP 401 is returned.

## Tasks / Subtasks

- [x] Task 1: Register HTTP client factory in DI (AC: #2)
  - [x] In `backend/Program.cs`, add `builder.Services.AddHttpClient();` in the services section (before `var app = builder.Build()`)

- [x] Task 2: Implement `BookService` CRUD methods (AC: #1, #2, #3, #4, #5)
  - [x] Add `IHttpClientFactory` field and update constructor signature: `public BookService(AppDbContext context, IHttpClientFactory httpClientFactory)`
  - [x] Add private `ValidateCoverUrlAsync(string? url)` helper — HEAD request, 5s timeout, returns url on 2xx, `null` on error/non-2xx/empty
  - [x] Implement `CreateAsync`: map request → `Book` entity, call `ValidateCoverUrlAsync` for `CoverImageUrl`, set `DateAdded = DateTime.UtcNow`, set `Status = "available"`, add to context, save, return `MapToDto`
  - [x] Implement `UpdateAsync`: find by id (return `null` if not found), update all mutable fields (Isbn, Title, Author, Genre, PublicationYear, CuratorNote, IsSelectionDuMois, Status), call `ValidateCoverUrlAsync` for `CoverImageUrl`, save, return `MapToDto` — do NOT update `DateAdded`
  - [x] Implement `DeleteAsync`: find by id (return `false` if not found), remove from context, save, return `true`

- [x] Task 3: Add POST, PUT, DELETE actions to `BooksController` (AC: #1, #3, #4, #5, #6)
  - [x] Add `[HttpPost] [Authorize] Create([FromBody] CreateBookRequest)` → call `CreateAsync`, return `CreatedAtAction(nameof(GetById), new { id = book.Id }, book)` (201 + Location header)
  - [x] Add `[HttpPut("{id}")] [Authorize] Update(int id, [FromBody] UpdateBookRequest)` → call `UpdateAsync`, return `Ok(book)` or `Problem(404)` if null
  - [x] Add `[HttpDelete("{id}")] [Authorize] Delete(int id)` → call `DeleteAsync`, return `NoContent()` (204) or `Problem(404)` if not found

- [x] Task 4: Update and extend tests (AC: all)
  - [x] In `BookServiceTests.cs`: add `FakeHttpMessageHandler` and `FakeHttpClientFactory` helper classes at the bottom of the file
  - [x] Update existing test constructor to: `_service = new BookService(_context, new FakeHttpClientFactory(new FakeHttpMessageHandler()));`
  - [x] Add `CreateAsync_ValidRequest_SetsDatesAndDefaultStatus` test
  - [x] Add `CreateAsync_BrokenCoverUrl_StoresNull` test (factory returns non-2xx)
  - [x] Add `CreateAsync_NullCoverUrl_StoresNull` test
  - [x] Add `UpdateAsync_ExistingId_UpdatesFieldsAndReturnsDto` test
  - [x] Add `UpdateAsync_UnknownId_ReturnsNull` test
  - [x] Add `DeleteAsync_ExistingId_RemovesBookAndReturnsTrue` test
  - [x] Add `DeleteAsync_UnknownId_ReturnsFalse` test

- [x] Task 5: Validation
  - [x] `dotnet test` in `backend.Tests/` — all tests pass (no regressions)
  - [x] `dotnet build` in `backend/` — 0 errors
  - [ ] Manual: `POST /api/books` without JWT → 401; with valid JWT → 201 + Location header
  - [ ] Manual: `DELETE /api/books/9999` with valid JWT → 404 ProblemDetails
  - [ ] Manual: `DELETE /api/books/{id}` with valid JWT → 204 no body, book gone from `GET /api/books`

## Dev Notes

### Scope: 4 files to change

| Action | File | Notes |
|--------|------|-------|
| Add 1 line | `backend/Program.cs` | `builder.Services.AddHttpClient()` in services section |
| Implement 3 stubs + update constructor | `backend/Services/BookService.cs` | `CreateAsync`, `UpdateAsync`, `DeleteAsync` — stubs already throw `NotImplementedException` |
| Add 3 actions | `backend/Controllers/BooksController.cs` | POST, PUT, DELETE — all with `[Authorize]` |
| Update constructor + add tests | `backend.Tests/Services/BookServiceTests.cs` | Constructor now requires fake IHttpClientFactory; add CRUD tests |

### What ALREADY EXISTS — DO NOT Recreate

| File | What's already there |
|------|----------------------|
| `backend/Models/DTOs/CreateBookRequest.cs` | Isbn, Title, Author, Genre, PublicationYear, CoverImageUrl, CuratorNote, IsSelectionDuMois — **no Status field** (Status always defaults to "available" in CreateAsync) |
| `backend/Models/DTOs/UpdateBookRequest.cs` | Same fields as Create + `Status` field |
| `backend/Models/DTOs/BookDto.cs` | All 11 fields including Id, DateAdded, Status |
| `backend/Models/Book.cs` | Entity with all fields; `DateAdded` and `Status = "available"` default |
| `backend/Services/Interfaces/IBookService.cs` | All 5 method signatures already declared |
| `backend/Services/BookService.cs` | `GetAllAsync`, `GetByIdAsync`, `MapToDto()` complete; CRUD stubs throw `NotImplementedException` |
| `backend/Controllers/BooksController.cs` | GET endpoints complete and public (no `[Authorize]`) |
| `backend/Middleware/ExceptionHandlingMiddleware.cs` | Catches all unhandled exceptions → ProblemDetails (no stack traces in prod) |
| `backend.Tests/Services/BookServiceTests.cs` | 12 passing tests for read methods — DO NOT break them |

### Task 1: `Program.cs` — Add HttpClient Registration

Add this line in the services section, before `var app = builder.Build()`:

```csharp
// ─── HTTP client factory (used by BookService for cover URL validation) ─────
builder.Services.AddHttpClient();
```

Place it after the `AddScoped<IBookService, BookService>()` line for readability.

### Task 2: `BookService.cs` — Complete Implementation

Replace the constructor and implement the 3 stubs:

```csharp
private readonly AppDbContext _context;
private readonly IHttpClientFactory _httpClientFactory;

public BookService(AppDbContext context, IHttpClientFactory httpClientFactory)
{
    _context = context;
    _httpClientFactory = httpClientFactory;
}

public async Task<BookDto> CreateAsync(CreateBookRequest request)
{
    var book = new Book
    {
        Isbn = request.Isbn,
        Title = request.Title,
        Author = request.Author,
        Genre = request.Genre,
        PublicationYear = request.PublicationYear,
        CoverImageUrl = await ValidateCoverUrlAsync(request.CoverImageUrl),
        CuratorNote = request.CuratorNote,
        DateAdded = DateTime.UtcNow,
        IsSelectionDuMois = request.IsSelectionDuMois,
        Status = "available",
    };
    _context.Books.Add(book);
    await _context.SaveChangesAsync();
    return MapToDto(book);
}

public async Task<BookDto?> UpdateAsync(int id, UpdateBookRequest request)
{
    var book = await _context.Books.FindAsync(id);
    if (book is null) return null;

    book.Isbn = request.Isbn;
    book.Title = request.Title;
    book.Author = request.Author;
    book.Genre = request.Genre;
    book.PublicationYear = request.PublicationYear;
    book.CoverImageUrl = await ValidateCoverUrlAsync(request.CoverImageUrl);
    book.CuratorNote = request.CuratorNote;
    book.IsSelectionDuMois = request.IsSelectionDuMois;
    book.Status = request.Status;
    // DateAdded intentionally NOT updated — preserves original add date

    await _context.SaveChangesAsync();
    return MapToDto(book);
}

public async Task<bool> DeleteAsync(int id)
{
    var book = await _context.Books.FindAsync(id);
    if (book is null) return false;
    _context.Books.Remove(book);
    await _context.SaveChangesAsync();
    return true;
}

private async Task<string?> ValidateCoverUrlAsync(string? url)
{
    if (string.IsNullOrWhiteSpace(url)) return null;
    try
    {
        using var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(5);
        var response = await client.SendAsync(
            new HttpRequestMessage(HttpMethod.Head, url));
        return response.IsSuccessStatusCode ? url : null;
    }
    catch
    {
        return null; // network error or timeout → treat as broken URL
    }
}
```

**Critical notes:**
- `Status` is hardcoded to `"available"` in `CreateAsync` — `CreateBookRequest` has no Status field
- `DateAdded = DateTime.UtcNow` — always UTC, never local time (ISO 8601 in API response)
- `ValidateCoverUrlAsync` called for both Create and Update to prevent broken URLs entering the system
- `ValidateCoverUrlAsync` catches ALL exceptions (including `InvalidOperationException` for malformed URLs) and returns `null`
- `MapToDto()` is already implemented and correct — do not duplicate it

### Task 3: `BooksController.cs` — Add CRUD Actions

Append after the existing `GetById` method. Keep the class structure intact:

```csharp
// POST /books
// [Authorize] — admin only (AC #6; NFR8)
[HttpPost]
[Authorize]
public async Task<ActionResult<BookDto>> Create([FromBody] CreateBookRequest request)
{
    var book = await _bookService.CreateAsync(request);
    return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
}

// PUT /books/{id}
// [Authorize] — admin only (AC #6)
[HttpPut("{id}")]
[Authorize]
public async Task<ActionResult<BookDto>> Update(int id, [FromBody] UpdateBookRequest request)
{
    var book = await _bookService.UpdateAsync(id, request);
    if (book is null)
        return Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not Found",
            detail: $"Book with id {id} was not found."
        );
    return Ok(book);
}

// DELETE /books/{id}
// [Authorize] — admin only (AC #6)
[HttpDelete("{id}")]
[Authorize]
public async Task<ActionResult> Delete(int id)
{
    var deleted = await _bookService.DeleteAsync(id);
    if (!deleted)
        return Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Not Found",
            detail: $"Book with id {id} was not found."
        );
    return NoContent(); // 204 — no body per HTTP spec
}
```

**Critical notes:**
- `CreatedAtAction(nameof(GetById), ...)` generates the correct `Location: /books/{id}` header (nginx exposes this as `/api/books/{id}` to the client)
- `[Authorize]` is on each action, not the class — GET endpoints must remain public
- `Problem()` is provided by `ControllerBase` and generates RFC 7807 ProblemDetails — same pattern as existing `GetById` 404
- `NoContent()` returns 204 with no body — do NOT return `Ok()` for DELETE

### Task 4: `BookServiceTests.cs` — Update and Extend

**CRITICAL REGRESSION PREVENTION:** The existing constructor `new BookService(_context)` will fail to compile after adding `IHttpClientFactory` to the constructor. You MUST update it.

Add these helper classes at the bottom of the file (inside the `Services` namespace but outside the test class):

```csharp
// Test doubles for IHttpClientFactory — no mocking library required
internal class FakeHttpMessageHandler(HttpStatusCode statusCode = HttpStatusCode.OK)
    : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
        => Task.FromResult(new HttpResponseMessage(statusCode));
}

internal class FakeHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
{
    public HttpClient CreateClient(string name) => new(handler);
}
```

Update the existing constructor in `BookServiceTests`:

```csharp
// Before (line ~27): _service = new BookService(_context);
// After:
_service = new BookService(_context,
    new FakeHttpClientFactory(new FakeHttpMessageHandler()));
```

New tests to add (append to the class before `Dispose()`):

```csharp
[Fact]
public async Task CreateAsync_ValidRequest_SetsDatesAndDefaultStatus()
{
    var request = new CreateBookRequest
    {
        Isbn = "978-0-13-235088-4",
        Title = "An Elegant Puzzle",
        Author = "Will Larson",
        Genre = "Management",
        PublicationYear = 2019,
    };

    var result = await _service.CreateAsync(request);

    Assert.Equal("An Elegant Puzzle", result.Title);
    Assert.Equal("available", result.Status);
    Assert.True(result.DateAdded <= DateTime.UtcNow);
    Assert.True(result.DateAdded > DateTime.UtcNow.AddSeconds(-5));
}

[Fact]
public async Task CreateAsync_BrokenCoverUrl_StoresNull()
{
    var service = new BookService(_context,
        new FakeHttpClientFactory(new FakeHttpMessageHandler(HttpStatusCode.NotFound)));
    var request = new CreateBookRequest
    {
        Isbn = "111", Title = "T", Author = "A",
        CoverImageUrl = "https://example.com/broken.jpg"
    };

    var result = await service.CreateAsync(request);

    Assert.Null(result.CoverImageUrl); // NFR13: broken URL → null, not stored
}

[Fact]
public async Task CreateAsync_ValidCoverUrl_StoresUrl()
{
    var request = new CreateBookRequest
    {
        Isbn = "222", Title = "T", Author = "A",
        CoverImageUrl = "https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg"
    };

    var result = await _service.CreateAsync(request);

    Assert.Equal("https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg", result.CoverImageUrl);
}

[Fact]
public async Task UpdateAsync_ExistingId_UpdatesAllMutableFields()
{
    var book = new Book
    {
        Isbn = "old", Title = "Old Title", Author = "Old Author",
        DateAdded = DateTime.UtcNow.AddDays(-1)
    };
    _context.Books.Add(book);
    await _context.SaveChangesAsync();
    var originalDateAdded = book.DateAdded;

    var request = new UpdateBookRequest
    {
        Isbn = "new-isbn", Title = "New Title", Author = "New Author",
        Genre = "Fiction", PublicationYear = 2024,
        IsSelectionDuMois = true, Status = "available"
    };

    var result = await _service.UpdateAsync(book.Id, request);

    Assert.NotNull(result);
    Assert.Equal("New Title", result.Title);
    Assert.Equal("new-isbn", result.Isbn);
    Assert.Equal("Fiction", result.Genre);
    Assert.Equal(2024, result.PublicationYear);
    Assert.True(result.IsSelectionDuMois);
    Assert.Equal(originalDateAdded, result.DateAdded); // DateAdded must NOT change
}

[Fact]
public async Task UpdateAsync_UnknownId_ReturnsNull()
{
    var result = await _service.UpdateAsync(9999, new UpdateBookRequest
    {
        Isbn = "x", Title = "T", Author = "A", Status = "available"
    });

    Assert.Null(result); // Controller maps null → 404
}

[Fact]
public async Task DeleteAsync_ExistingId_RemovesBookAndReturnsTrue()
{
    var book = new Book { Isbn = "del", Title = "To Delete", Author = "A", DateAdded = DateTime.UtcNow };
    _context.Books.Add(book);
    await _context.SaveChangesAsync();

    var deleted = await _service.DeleteAsync(book.Id);
    var found = await _context.Books.FindAsync(book.Id);

    Assert.True(deleted);
    Assert.Null(found); // Book actually removed from DB
}

[Fact]
public async Task DeleteAsync_UnknownId_ReturnsFalse()
{
    var deleted = await _service.DeleteAsync(9999);

    Assert.False(deleted); // Controller maps false → 404
}
```

**Import to add** at the top of `BookServiceTests.cs`:
```csharp
using System.Net;
using PortailMediatheque.Api.Models.DTOs;
```

### Architecture Compliance

- `[Authorize]` on each CRUD action — GET endpoints remain public (never add `[Authorize]` to the class)
- Controller → Service → DbContext — never inject `AppDbContext` into the controller
- All controller actions and service methods are `async` with `Task<T>` return type (architecture rule: "All service methods suffixed `Async`")
- `Problem()` used for all error responses → RFC 7807 ProblemDetails format (architecture rule)
- `BookService.CreateAsync` auto-sets `DateAdded` (FR35) — never accept it from the client
- `Status` defaults to `"available"` (FR26) in Create — never expose it to client in `CreateBookRequest`
- 5-second timeout on HEAD check matches the architecture's external API timeout pattern
- `ValidateCoverUrlAsync` NEVER throws — always returns `null` on failure (NFR13 + architecture: "never throw on API failure")

### Critical Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| `[Authorize]` on the entire `BooksController` class | `[Authorize]` on POST/PUT/DELETE only — GET stays public |
| `book.DateAdded = request.DateAdded` in `UpdateAsync` | `DateAdded` is set once at creation, never updated |
| Returning `Ok()` from DELETE | Return `NoContent()` (204) for successful deletes |
| `new HttpClient()` directly | Always use `_httpClientFactory.CreateClient()` |
| Throwing exception when cover URL fails HEAD check | Return `null` silently — never block the request |
| `string.IsNullOrEmpty` instead of `string.IsNullOrWhiteSpace` for URL | Use `IsNullOrWhiteSpace` to also catch whitespace-only strings |

### Project Structure Notes

No new files — only modifications to existing files:
```
backend/
  Program.cs                          ← +1 line: AddHttpClient()
  Controllers/BooksController.cs      ← +3 actions: POST, PUT, DELETE
  Services/BookService.cs             ← +constructor param, +4 methods (3 CRUD + ValidateCoverUrlAsync)

backend.Tests/
  Services/BookServiceTests.cs        ← +constructor update, +2 helper classes, +8 new tests
```

No new DTOs, models, or migrations required — all supporting infrastructure was created in earlier stories.

### References

- Story 2.1 (BookService read methods established, test patterns): [_bmad-output/implementation-artifacts/2-1-public-books-api-list-and-detail-endpoints.md](_bmad-output/implementation-artifacts/2-1-public-books-api-list-and-detail-endpoints.md)
- Epic 5, Story 5.1 acceptance criteria: `_bmad-output/planning-artifacts/epics.md` (section "Story 5.1")
- Architecture — API patterns, HTTP status codes, anti-patterns: `_bmad-output/planning-artifacts/architecture.md` (sections: API & Communication Patterns, HTTP status codes, Anti-patterns)
- `BooksController.cs` (existing GET actions): [backend/Controllers/BooksController.cs](backend/Controllers/BooksController.cs)
- `BookService.cs` (stubs to implement): [backend/Services/BookService.cs](backend/Services/BookService.cs)
- `IBookService.cs` (interface already complete): [backend/Services/Interfaces/IBookService.cs](backend/Services/Interfaces/IBookService.cs)
- `CreateBookRequest.cs` (no Status field): [backend/Models/DTOs/CreateBookRequest.cs](backend/Models/DTOs/CreateBookRequest.cs)
- `UpdateBookRequest.cs` (has Status field): [backend/Models/DTOs/UpdateBookRequest.cs](backend/Models/DTOs/UpdateBookRequest.cs)
- `Book.cs` (entity model): [backend/Models/Book.cs](backend/Models/Book.cs)
- `Program.cs` (DI registrations): [backend/Program.cs](backend/Program.cs)
- `BookServiceTests.cs` (existing tests — must not regress): [backend.Tests/Services/BookServiceTests.cs](backend.Tests/Services/BookServiceTests.cs)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Fixed compilation error in `BooksControllerTests.cs` — that file also instantiated `BookService` with the old single-argument constructor after the DI change. Updated to use `FakeHttpClientFactory` as well.

### Completion Notes List

Implemented `CreateAsync`, `UpdateAsync`, `DeleteAsync`, and `ValidateCoverUrlAsync` in `BookService`. Added POST, PUT, DELETE actions to `BooksController` with `[Authorize]` on each (GET endpoints remain public). Registered `AddHttpClient()` in DI. Updated both test files to use `FakeHttpClientFactory`/`FakeHttpMessageHandler` test doubles. All 39 tests pass (0 regressions).

### File List

- backend/Program.cs
- backend/Controllers/BooksController.cs
- backend/Services/BookService.cs
- backend.Tests/Services/BookServiceTests.cs
- backend.Tests/Controllers/BooksControllerTests.cs
- _bmad-output/implementation-artifacts/5-1-book-crud-api-create-update-delete-endpoints.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-04-23: Implemented Book CRUD API (Create, Update, Delete) — Story 5.1 complete
