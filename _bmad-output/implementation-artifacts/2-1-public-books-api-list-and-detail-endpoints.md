# Story 2.1: Public Books API — List & Detail Endpoints

Status: review

## Story

As a developer,
I want the public backend API endpoints for listing and retrieving books,
So that frontend components in subsequent stories have a working data source.

## Acceptance Criteria

1. **Given** books exist in the database, **when** `GET /api/books` is called (no auth required), **then** HTTP 200 is returned with an array of all books as `BookDto` objects in camelCase JSON **and** the response includes all FR34 fields: `id`, `isbn`, `title`, `author`, `genre`, `publicationYear`, `coverImageUrl`, `curatorNote`, `dateAdded`, `isSelectionDuMois`, `status`.

2. **Given** a `?sortBy=dateAdded` query parameter is passed, **when** `GET /api/books?sortBy=dateAdded` is called, **then** books are returned ordered by `dateAdded DESC`.

3. **Given** a book with a specific id exists, **when** `GET /api/books/{id}` is called (no auth required), **then** HTTP 200 is returned with the full `BookDto` for that book.

4. **Given** no book exists for the requested id, **when** `GET /api/books/{id}` is called, **then** HTTP 404 with a ProblemDetails body (`application/problem+json`) is returned.

5. **Given** `?isSelectionDuMois=true` is passed as a query parameter, **when** `GET /api/books?isSelectionDuMois=true` is called, **then** only books with `IsSelectionDuMois = true` are returned.

6. **Given** the database is empty, **when** `GET /api/books` is called, **then** HTTP 200 with an empty array `[]` is returned (never `null`).

## Tasks / Subtasks

- [x] Task 1: Implement `BookService.cs` (AC: #1, #2, #3, #5, #6)
  - [x] Create `backend/Services/BookService.cs` implementing `IBookService`
  - [x] Implement `GetAllAsync(bool? isSelectionDuMois, string? sortBy)` — EF Core LINQ query with optional filter and sort
  - [x] Implement `GetByIdAsync(int id)` — returns null if not found (controller maps null → 404)
  - [x] Stub `CreateAsync`, `UpdateAsync`, `DeleteAsync` with `throw new NotImplementedException()` (Story 5.1)
  - [x] Map `Book` entity to `BookDto` via a private helper `MapToDto(Book book)`

- [x] Task 2: Implement `BooksController.cs` (AC: #1–#6)
  - [x] Create `backend/Controllers/BooksController.cs` with `[ApiController]` and `[Route("[controller]")]`
  - [x] Add `GET` action `GetAll([FromQuery] bool? isSelectionDuMois, [FromQuery] string? sortBy)` — no `[Authorize]`
  - [x] Add `GET("{id}")` action `GetById(int id)` — return `Problem(statusCode: 404)` when null, no `[Authorize]`

- [x] Task 3: Register DI in `Program.cs` (AC: #1)
  - [x] Add `builder.Services.AddScoped<IBookService, BookService>()` before `builder.Build()`
  - [x] Add required `using` directives for `BookService` and `IBookService`

- [x] Task 4: Write tests — `BookServiceTests.cs` (AC: #1–#6)
  - [x] Create `backend.Tests/Services/BookServiceTests.cs` using in-memory SQLite (same pattern as `DatabaseSetupTests.cs`)
  - [x] Test: `GetAllAsync` returns all books when no filter
  - [x] Test: `GetAllAsync` returns `[]` for empty DB
  - [x] Test: `GetAllAsync` with `isSelectionDuMois=true` returns only matching books
  - [x] Test: `GetAllAsync` with `sortBy="dateAdded"` returns books ordered by `DateAdded` descending
  - [x] Test: `GetByIdAsync` returns correct book by id
  - [x] Test: `GetByIdAsync` returns `null` for unknown id

- [x] Task 5: Write tests — `BooksControllerTests.cs` (AC: #3, #4)
  - [x] Create `backend.Tests/Controllers/BooksControllerTests.cs` using in-memory SQLite + real `BookService`
  - [x] Test: `GetById` returns `OkObjectResult` with `BookDto` when book exists
  - [x] Test: `GetById` returns `ObjectResult` with status 404 when book not found

- [x] Task 6: Validation
  - [x] `dotnet build` — 0 errors, 0 warnings
  - [x] `dotnet test` — all tests pass, no regressions

## Dev Notes

### Scope: Backend only — no Angular changes in this story

The Angular `BookService` (`frontend/src/app/shared/services/book.service.ts`) already has `getAll()` and `getById()` stubs from Story 1.1. **Do NOT modify it.** Frontend components consuming the API are built in Stories 2.2–2.5.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `IBookService` interface | `backend/Services/Interfaces/IBookService.cs` | COMPLETE — all method signatures defined |
| `BookDto` | `backend/Models/DTOs/BookDto.cs` | COMPLETE — all FR34 fields |
| `Book` entity | `backend/Models/Book.cs` | COMPLETE — EF Core entity with all FR34 fields |
| `AppDbContext` | `backend/Data/AppDbContext.cs` | COMPLETE — `DbSet<Book> Books` ready to query |
| `CreateBookRequest` | `backend/Models/DTOs/CreateBookRequest.cs` | COMPLETE (Story 5.1 will call it) |
| `UpdateBookRequest` | `backend/Models/DTOs/UpdateBookRequest.cs` | COMPLETE (Story 5.1 will call it) |
| `ExceptionHandlingMiddleware` | `backend/Middleware/ExceptionHandlingMiddleware.cs` | COMPLETE — handles 500s only |
| Angular `book.service.ts` | `frontend/src/app/shared/services/book.service.ts` | STUB — do not modify |
| `Book` TypeScript model | `frontend/src/app/shared/models/book.model.ts` | COMPLETE — do not modify |

### `IBookService` Interface (read before implementing)

```csharp
// backend/Services/Interfaces/IBookService.cs — ALREADY EXISTS
Task<IEnumerable<BookDto>> GetAllAsync(bool? isSelectionDuMois = null, string? sortBy = null);
Task<BookDto?> GetByIdAsync(int id);
Task<BookDto> CreateAsync(CreateBookRequest request);       // Story 5.1
Task<BookDto?> UpdateAsync(int id, UpdateBookRequest request); // Story 5.1
Task<bool> DeleteAsync(int id);                             // Story 5.1
```

### Task 1: `BookService.cs` Implementation

**File:** `backend/Services/BookService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Services;

public class BookService : IBookService
{
    private readonly AppDbContext _context;

    public BookService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BookDto>> GetAllAsync(
        bool? isSelectionDuMois = null,
        string? sortBy = null)
    {
        var query = _context.Books.AsQueryable();

        if (isSelectionDuMois.HasValue)
            query = query.Where(b => b.IsSelectionDuMois == isSelectionDuMois.Value);

        if (sortBy?.Equals("dateAdded", StringComparison.OrdinalIgnoreCase) == true)
            query = query.OrderByDescending(b => b.DateAdded);

        return await query.Select(b => MapToDto(b)).ToListAsync();
    }

    public async Task<BookDto?> GetByIdAsync(int id)
    {
        var book = await _context.Books.FindAsync(id);
        return book is null ? null : MapToDto(book);
    }

    // Story 5.1 — not implemented in this story
    public Task<BookDto> CreateAsync(CreateBookRequest request) =>
        throw new NotImplementedException("CreateAsync is implemented in Story 5.1");

    public Task<BookDto?> UpdateAsync(int id, UpdateBookRequest request) =>
        throw new NotImplementedException("UpdateAsync is implemented in Story 5.1");

    public Task<bool> DeleteAsync(int id) =>
        throw new NotImplementedException("DeleteAsync is implemented in Story 5.1");

    private static BookDto MapToDto(Book book) => new()
    {
        Id = book.Id,
        Isbn = book.Isbn,
        Title = book.Title,
        Author = book.Author,
        Genre = book.Genre,
        PublicationYear = book.PublicationYear,
        CoverImageUrl = book.CoverImageUrl,
        CuratorNote = book.CuratorNote,
        DateAdded = book.DateAdded,
        IsSelectionDuMois = book.IsSelectionDuMois,
        Status = book.Status,
    };
}
```

### Task 2: `BooksController.cs` Implementation

**File:** `backend/Controllers/BooksController.cs`

**Critical route pattern:** Use `[Route("[controller]")]` — NOT `[Route("api/[controller]")]`. nginx strips the `/api` prefix before proxying to the backend (see `nginx.conf`: `proxy_pass http://backend:5000/;`). In dev, Angular calls `http://localhost:5000/books` directly.

```csharp
using Microsoft.AspNetCore.Mvc;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Controllers;

[ApiController]
[Route("[controller]")]  // → /books (nginx strips /api; Angular dev calls :5000/books directly)
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    // GET /books  or  GET /books?isSelectionDuMois=true  or  GET /books?sortBy=dateAdded
    // No [Authorize] — public endpoint (AC #1, #5, #6)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookDto>>> GetAll(
        [FromQuery] bool? isSelectionDuMois = null,
        [FromQuery] string? sortBy = null)
    {
        var books = await _bookService.GetAllAsync(isSelectionDuMois, sortBy);
        return Ok(books);
    }

    // GET /books/{id}
    // No [Authorize] — public endpoint (AC #3, #4)
    [HttpGet("{id}")]
    public async Task<ActionResult<BookDto>> GetById(int id)
    {
        var book = await _bookService.GetByIdAsync(id);
        if (book is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: $"Book with id {id} was not found."
            );
        return Ok(book);
    }
}
```

**Why `Problem()` instead of `NotFound()`:** `Problem()` returns a `ObjectResult` with a `ProblemDetails` body (`application/problem+json`), satisfying AC #4. `NotFound()` alone returns an empty 404 body. The `ExceptionHandlingMiddleware` only intercepts unhandled exceptions (500s) — it does NOT transform 404 responses.

### Task 3: DI Registration in `Program.cs`

In `Program.cs`, add these lines **after** the `AddDbContext` registration and **before** `builder.Build()`:

```csharp
// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookService, BookService>();
```

Add the using directive at the top of `Program.cs`:
```csharp
using PortailMediatheque.Api.Services;
using PortailMediatheque.Api.Services.Interfaces;
```

### Task 4: `BookServiceTests.cs` — Testing Pattern

**File:** `backend.Tests/Services/BookServiceTests.cs`

Follow the EXACT pattern from `DatabaseSetupTests.cs`: SQLite in-memory with `SqliteConnection` kept open for the test lifetime.

```csharp
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Services;

namespace backend.Tests.Services;

public class BookServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly SqliteConnection _connection;
    private readonly BookService _service;

    public BookServiceTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
        _service = new BookService(_context);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllBooks()
    {
        _context.Books.AddRange(
            new Book { Isbn = "111", Title = "A", Author = "Auth1", DateAdded = DateTime.UtcNow },
            new Book { Isbn = "222", Title = "B", Author = "Auth2", DateAdded = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync();

        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetAllAsync_EmptyDb_ReturnsEmptyList()
    {
        var result = await _service.GetAllAsync();
        Assert.Empty(result); // Never null (AC #6)
    }

    [Fact]
    public async Task GetAllAsync_FilterByIsSelectionDuMois_ReturnsOnlyMatchingBooks()
    {
        _context.Books.AddRange(
            new Book { Isbn = "111", Title = "Featured", Author = "A", IsSelectionDuMois = true, DateAdded = DateTime.UtcNow },
            new Book { Isbn = "222", Title = "Regular", Author = "B", IsSelectionDuMois = false, DateAdded = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync(isSelectionDuMois: true);

        Assert.Single(result);
        Assert.Equal("Featured", result.First().Title);
    }

    [Fact]
    public async Task GetAllAsync_SortByDateAdded_ReturnsNewestFirst()
    {
        var older = DateTime.UtcNow.AddDays(-2);
        var newer = DateTime.UtcNow;
        _context.Books.AddRange(
            new Book { Isbn = "111", Title = "Older", Author = "A", DateAdded = older },
            new Book { Isbn = "222", Title = "Newer", Author = "B", DateAdded = newer }
        );
        await _context.SaveChangesAsync();

        var result = (await _service.GetAllAsync(sortBy: "dateAdded")).ToList();

        Assert.Equal("Newer", result[0].Title); // Newest first (DESC)
        Assert.Equal("Older", result[1].Title);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsBookDto()
    {
        var book = new Book { Isbn = "123", Title = "Test", Author = "Auth", DateAdded = DateTime.UtcNow };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(book.Id);

        Assert.NotNull(result);
        Assert.Equal("Test", result.Title);
        Assert.Equal("123", result.Isbn);
    }

    [Fact]
    public async Task GetByIdAsync_UnknownId_ReturnsNull()
    {
        var result = await _service.GetByIdAsync(9999);
        Assert.Null(result); // Controller maps null → 404 (AC #4)
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
```

### Task 5: `BooksControllerTests.cs` — Testing Pattern

**File:** `backend.Tests/Controllers/BooksControllerTests.cs`

Use a real `BookService` backed by in-memory SQLite (no mocking framework — consistent with project's test style).

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Controllers;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services;

namespace backend.Tests.Controllers;

public class BooksControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly SqliteConnection _connection;
    private readonly BooksController _controller;

    public BooksControllerTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
        _controller = new BooksController(new BookService(_context));
    }

    [Fact]
    public async Task GetById_ExistingBook_Returns200WithBookDto()
    {
        var book = new Book { Isbn = "123", Title = "Test Book", Author = "Auth", DateAdded = DateTime.UtcNow };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var result = await _controller.GetById(book.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<BookDto>(ok.Value);
        Assert.Equal("Test Book", dto.Title);
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404WithProblemDetails()
    {
        var result = await _controller.GetById(9999);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(404, objectResult.StatusCode); // AC #4
        Assert.IsType<ProblemDetails>(objectResult.Value);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
```

### Project Structure Notes

**Files to create (this story):**
```
backend/
  Controllers/
    BooksController.cs           ← NEW — GET /books, GET /books/{id}
  Services/
    BookService.cs               ← NEW — GetAllAsync, GetByIdAsync (stubs for Create/Update/Delete)

backend.Tests/
  Services/
    BookServiceTests.cs          ← NEW — 6 tests
  Controllers/
    BooksControllerTests.cs      ← NEW — 2 tests
```

**Files to modify (this story):**
```
backend/
  Program.cs                     ← ADD DI registration: AddScoped<IBookService, BookService>()
```

**Files NOT touched in this story:**
- All frontend files (Stories 2.2–2.5 consume the API)
- `IBookService.cs` interface (already complete)
- All DTO and model files (already complete)
- `ExceptionHandlingMiddleware.cs` (already complete)

### Architecture Compliance

**Route pattern MUST be `[Route("[controller]")]`** — NOT `[Route("api/[controller]")]`
- nginx strips `/api` before proxying: `proxy_pass http://backend:5000/;`
- Angular dev calls `http://localhost:5000/books` directly (see `environment.ts: apiUrl: 'http://localhost:5000'`)
- Inconsistency here would break both production (double `/api/api/`) and local dev

**Service injection MUST go through `IBookService`** — never inject `AppDbContext` directly in controllers (architecture invariant)

**No `[Authorize]` on GET endpoints** — public endpoints (FR1); `[Authorize]` will be added to POST/PUT/DELETE in Story 5.1

**camelCase JSON** — already the default with `System.Text.Json`; do NOT add any serialization configuration

**`IEnumerable<BookDto>` — never null** — `ToListAsync()` returns `[]` for empty results (AC #6)

### Scope Guard — What NOT to Implement

| Feature | Story |
|---------|-------|
| POST /books, PUT /books/{id}, DELETE /books/{id} | Story 5.1 |
| `?title=`, `?author=`, `?genre=`, `?year=`, `?keyword=` query params | Story 3.1 |
| Cover URL HTTP HEAD validation in `CreateAsync` | Story 5.1 |
| Angular BookService, catalog components | Stories 2.2–2.5 |
| ISBN controller/service | Story 6.1 |
| Auth controller | Story 4.1 |

### References

- `IBookService` interface: [Source: `backend/Services/Interfaces/IBookService.cs`]
- Route & naming conventions: [Source: `_bmad-output/planning-artifacts/architecture.md` — Implementation Patterns & Consistency Rules]
- Backend async pattern: [Source: `architecture.md` — Process Patterns: Backend async pattern]
- ProblemDetails for errors: [Source: `architecture.md` — API & Communication Patterns: Response format]
- Testing pattern: [Source: `backend.Tests/Services/DatabaseSetupTests.cs` — SQLite in-memory setup]
- nginx prefix stripping: [Source: `_bmad-output/implementation-artifacts/1-4-docker-compose-and-production-deployment-configuration.md` — nginx/nginx.conf section]
- `Book` entity definition: [Source: `backend/Models/Book.cs`]
- `BookDto` definition: [Source: `backend/Models/DTOs/BookDto.cs`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `dotnet build` — 0 errors, 0 warnings (NETSDK1057 preview message only, not a warning)
- `dotnet test` — 22/22 passed (14 pre-existing + 6 BookServiceTests + 2 BooksControllerTests)

### Completion Notes List

- ✅ Task 1: `backend/Services/BookService.cs` created — `GetAllAsync` with optional `isSelectionDuMois` filter and `dateAdded DESC` sort; `GetByIdAsync` returns null for missing id; `CreateAsync`/`UpdateAsync`/`DeleteAsync` throw `NotImplementedException` (Story 5.1 placeholders); `MapToDto` private helper maps all FR34 fields.
- ✅ Task 2: `backend/Controllers/BooksController.cs` created — `[Route("[controller]")]` (routes to `/books`; nginx strips `/api` prefix); `GetAll` accepts optional `isSelectionDuMois` and `sortBy` query params, no `[Authorize]`; `GetById` returns `Problem(statusCode: 404)` with ProblemDetails body for missing books.
- ✅ Task 3: `backend/Program.cs` updated — `AddScoped<IBookService, BookService>()` registered; `using` directives added for `Services` and `Services.Interfaces` namespaces.
- ✅ Task 4: `backend.Tests/Services/BookServiceTests.cs` created — 6 tests covering all ACs; in-memory SQLite pattern consistent with `DatabaseSetupTests.cs`.
- ✅ Task 5: `backend.Tests/Controllers/BooksControllerTests.cs` created — 2 tests: 200 with BookDto on success, 404 ProblemDetails on missing id.
- ✅ Task 6: Build clean (0 errors, 0 warnings); all 22 tests pass with zero regressions.

## File List

**New files:**
- `backend/Controllers/BooksController.cs`
- `backend/Services/BookService.cs`
- `backend.Tests/Services/BookServiceTests.cs`
- `backend.Tests/Controllers/BooksControllerTests.cs`

**Modified files:**
- `backend/Program.cs` — added `using` directives + `AddScoped<IBookService, BookService>()` DI registration

## Change Log

| Date | Change |
|------|--------|
| 2026-04-14 | Story created — public books API list & detail endpoints plan documented. |
| 2026-04-14 | Implementation complete — `BookService`, `BooksController`, DI registration, 8 new tests; 22/22 pass. |
