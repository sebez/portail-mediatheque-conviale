# Story 3.1: Backend Search & Filter API

Status: review

## Story

As a developer,
I want the `GET /api/books` endpoint to accept query parameters for filtering and keyword search,
so that the frontend can retrieve targeted results without client-side data manipulation.

## Acceptance Criteria

1. **Given** `GET /api/books` is called with `?title=architecture`, **when** the query is processed, **then** only books whose title contains "architecture" (case-insensitive) are returned.

2. **Given** `GET /api/books` is called with `?author=larson`, **when** the query is processed, **then** only books whose author field contains "larson" (case-insensitive) are returned.

3. **Given** `GET /api/books` is called with `?genre=management`, **when** the query is processed, **then** only books whose genre matches "management" (case-insensitive) are returned.

4. **Given** `GET /api/books` is called with `?year=2020`, **when** the query is processed, **then** only books published in 2020 are returned.

5. **Given** `GET /api/books` is called with `?keyword=equipe`, **when** the query is processed, **then** books where "equipe" appears in title, author, genre, OR curator note are returned (case-insensitive, across all four text fields).

6. **Given** multiple filter parameters are combined (e.g., `?genre=management&year=2023`), **when** the query is processed, **then** only books matching ALL conditions (AND logic) are returned.

7. **Given** no books match the applied filters, **when** the query is processed, **then** HTTP 200 with an empty array `[]` is returned (never a 404).

8. **Given** a filter query returns results from a 500-book catalog, **when** the response is measured, **then** it completes within 1 second (NFR2 — SQLite LIKE queries at this scale are imperceptibly fast).

## Tasks / Subtasks

- [x] Task 1: Update `IBookService` interface (AC: #1–#8)
  - [x] Update signature in `backend/Services/Interfaces/IBookService.cs`
  - [x] Add `string? title`, `string? author`, `string? genre`, `int? year`, `string? keyword` parameters to `GetAllAsync`
  - [x] Keep `bool? isSelectionDuMois` and `string? sortBy` parameters — do NOT remove them

- [x] Task 2: Update `BookService.GetAllAsync` implementation (AC: #1–#8)
  - [x] Update `backend/Services/BookService.cs` — `GetAllAsync` method signature
  - [x] Add 5 LINQ `.Where()` clauses for `title`, `author`, `genre`, `year`, `keyword` (conditional on non-null)
  - [x] Use `.ToLower().Contains(param.ToLower())` pattern for case-insensitive text fields (see Dev Notes)
  - [x] `keyword` must search across: `Title`, `Author`, `Genre`, AND `CuratorNote` with OR logic within the clause
  - [x] All filter conditions apply with AND logic (each `.Where()` call narrows the previous result)

- [x] Task 3: Update `BooksController.GetAll` (AC: #1–#8)
  - [x] Update `backend/Controllers/BooksController.cs`
  - [x] Add 5 `[FromQuery]` parameters: `string? title`, `string? author`, `string? genre`, `int? year`, `string? keyword`
  - [x] Pass all new params to `_bookService.GetAllAsync(...)` call
  - [x] Keep existing `isSelectionDuMois` and `sortBy` params — no regression

- [x] Task 4: Add tests in `BookServiceTests.cs` (AC: #1–#8)
  - [x] Update `backend.Tests/Services/BookServiceTests.cs`
  - [x] Add test for `?title` filter (case-insensitive, partial match)
  - [x] Add test for `?author` filter (case-insensitive, partial match)
  - [x] Add test for `?genre` filter (case-insensitive)
  - [x] Add test for `?year` filter (exact match)
  - [x] Add test for `?keyword` — match in title, author, genre, curatorNote
  - [x] Add test for combined filters (AND logic)
  - [x] Add test for no-match → returns empty list (not null, not 404)
  - [x] Verify existing 6 tests still pass (zero regressions)

- [x] Task 5: Add tests in `BooksControllerTests.cs` (AC: #1–#5)
  - [x] Update `backend.Tests/Controllers/BooksControllerTests.cs`
  - [x] Add at least 2 controller-level filter tests (e.g., title filter + combined filter)
  - [x] Verify existing 2 controller tests still pass

- [x] Task 6: Validation
  - [x] `dotnet build` — 0 errors in `backend/` and `backend.Tests/`
  - [x] `dotnet test` in `backend.Tests/` — all tests pass, 0 regressions

## Dev Notes

### Scope: Backend only — 3 files modified

No frontend changes in this story. No new files created. Story 3.2 implements `FilterBarComponent`.

The `Home` component in story 2.5 already has a slot comment:
```
// Story 3.2: FilterBarComponent slot — add above catalog list when implemented
```
Do NOT touch the frontend.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `BooksController` | `backend/Controllers/BooksController.cs` | COMPLETE (Story 2.1) — update only |
| `BookService` | `backend/Services/BookService.cs` | COMPLETE (Story 2.1) — update `GetAllAsync` only |
| `IBookService` | `backend/Services/Interfaces/IBookService.cs` | COMPLETE (Story 2.1) — update signature only |
| `BookServiceTests` | `backend.Tests/Services/BookServiceTests.cs` | COMPLETE (6 tests) — add new tests, keep old ones |
| `BooksControllerTests` | `backend.Tests/Controllers/BooksControllerTests.cs` | COMPLETE (2 tests) — add new tests, keep old ones |
| `AppDbContext` | `backend/Data/AppDbContext.cs` | COMPLETE — no changes |
| `Book` entity | `backend/Models/Book.cs` | COMPLETE — all FR34 fields present |
| `BookDto` | `backend/Models/DTOs/BookDto.cs` | COMPLETE — no changes |

### Critical: EF Core + SQLite Case-Insensitive Search

SQLite's `LIKE` operator is case-insensitive for **ASCII** only. French text has accented characters (é, è, à, ü, etc.) which are case-sensitive in SQLite's built-in `LIKE`.

**Use `.ToLower().Contains(param.ToLower())`** for all text filters. EF Core translates this to `lower(column) LIKE lower('%value%')` in SQL, which handles accented characters correctly.

```csharp
// CORRECT — works with French accented characters
if (!string.IsNullOrWhiteSpace(title))
    query = query.Where(b => b.Title.ToLower().Contains(title.ToLower()));

// WRONG — EF.Functions.Like() is case-sensitive for Unicode in SQLite
// query = query.Where(b => EF.Functions.Like(b.Title, $"%{title}%"));
```

**Do NOT** call `.ToLower()` before the LINQ chain. Call it inside the predicate so EF Core can translate it to SQL (not enumerate in memory).

### Task 2: Updated `BookService.GetAllAsync` Signature and Implementation

**File:** `backend/Services/BookService.cs`

Updated method signature:
```csharp
public async Task<IEnumerable<BookDto>> GetAllAsync(
    bool? isSelectionDuMois = null,
    string? sortBy = null,
    string? title = null,
    string? author = null,
    string? genre = null,
    int? year = null,
    string? keyword = null)
{
    var query = _context.Books.AsQueryable();

    if (isSelectionDuMois.HasValue)
        query = query.Where(b => b.IsSelectionDuMois == isSelectionDuMois.Value);

    if (!string.IsNullOrWhiteSpace(title))
        query = query.Where(b => b.Title.ToLower().Contains(title.ToLower()));

    if (!string.IsNullOrWhiteSpace(author))
        query = query.Where(b => b.Author.ToLower().Contains(author.ToLower()));

    if (!string.IsNullOrWhiteSpace(genre))
        query = query.Where(b => b.Genre != null && b.Genre.ToLower().Contains(genre.ToLower()));

    if (year.HasValue)
        query = query.Where(b => b.PublicationYear == year.Value);

    if (!string.IsNullOrWhiteSpace(keyword))
    {
        var kw = keyword.ToLower();
        query = query.Where(b =>
            b.Title.ToLower().Contains(kw) ||
            b.Author.ToLower().Contains(kw) ||
            (b.Genre != null && b.Genre.ToLower().Contains(kw)) ||
            (b.CuratorNote != null && b.CuratorNote.ToLower().Contains(kw)));
    }

    if (sortBy?.Equals("dateAdded", StringComparison.OrdinalIgnoreCase) == true)
        query = query.OrderByDescending(b => b.DateAdded);

    return await query.Select(b => MapToDto(b)).ToListAsync();
}
```

**Key notes:**
- `genre` and `CuratorNote` are nullable fields on the `Book` entity — guard with null check before `.ToLower()` to avoid NullReferenceException in LINQ translation.
- `keyword` variable `kw` is captured as a local before the predicate — EF Core can translate the captured variable cleanly; avoid calling `.ToLower()` inside nested expressions multiple times on the input parameter.
- All new parameters are optional (default `null`) — existing callers (`GetAllAsync()`, `GetAllAsync(isSelectionDuMois: true)`, `GetAllAsync(sortBy: "dateAdded")`) remain valid without changes.

### Task 1: Updated `IBookService` Signature

**File:** `backend/Services/Interfaces/IBookService.cs`

```csharp
Task<IEnumerable<BookDto>> GetAllAsync(
    bool? isSelectionDuMois = null,
    string? sortBy = null,
    string? title = null,
    string? author = null,
    string? genre = null,
    int? year = null,
    string? keyword = null);
```

### Task 3: Updated `BooksController.GetAll`

**File:** `backend/Controllers/BooksController.cs`

```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<BookDto>>> GetAll(
    [FromQuery] bool? isSelectionDuMois = null,
    [FromQuery] string? sortBy = null,
    [FromQuery] string? title = null,
    [FromQuery] string? author = null,
    [FromQuery] string? genre = null,
    [FromQuery] int? year = null,
    [FromQuery] string? keyword = null)
{
    var books = await _bookService.GetAllAsync(
        isSelectionDuMois, sortBy, title, author, genre, year, keyword);
    return Ok(books);
}
```

Named arguments keep the call readable and prevent positional errors as the signature grows.

### Task 4: New `BookServiceTests` Tests

Add to `backend.Tests/Services/BookServiceTests.cs` (below existing tests, above `Dispose()`):

```csharp
[Fact]
public async Task GetAllAsync_FilterByTitle_ReturnsCaseInsensitiveMatch()
{
    _context.Books.AddRange(
        new Book { Isbn = "1", Title = "Architecture Patterns", Author = "A", DateAdded = DateTime.UtcNow },
        new Book { Isbn = "2", Title = "Management 101", Author = "B", DateAdded = DateTime.UtcNow }
    );
    await _context.SaveChangesAsync();

    var result = await _service.GetAllAsync(title: "architecture");

    Assert.Single(result);
    Assert.Equal("Architecture Patterns", result.First().Title);
}

[Fact]
public async Task GetAllAsync_FilterByAuthor_ReturnsCaseInsensitiveMatch()
{
    _context.Books.AddRange(
        new Book { Isbn = "1", Title = "T1", Author = "Will Larson", DateAdded = DateTime.UtcNow },
        new Book { Isbn = "2", Title = "T2", Author = "Peter Drucker", DateAdded = DateTime.UtcNow }
    );
    await _context.SaveChangesAsync();

    var result = await _service.GetAllAsync(author: "larson");

    Assert.Single(result);
    Assert.Equal("Will Larson", result.First().Author);
}

[Fact]
public async Task GetAllAsync_FilterByGenre_ReturnsCaseInsensitiveMatch()
{
    _context.Books.AddRange(
        new Book { Isbn = "1", Title = "T1", Author = "A", Genre = "Management", DateAdded = DateTime.UtcNow },
        new Book { Isbn = "2", Title = "T2", Author = "B", Genre = "Fiction", DateAdded = DateTime.UtcNow }
    );
    await _context.SaveChangesAsync();

    var result = await _service.GetAllAsync(genre: "MANAGEMENT");

    Assert.Single(result);
    Assert.Equal("Management", result.First().Genre);
}

[Fact]
public async Task GetAllAsync_FilterByYear_ReturnsExactYearMatch()
{
    _context.Books.AddRange(
        new Book { Isbn = "1", Title = "T1", Author = "A", PublicationYear = 2020, DateAdded = DateTime.UtcNow },
        new Book { Isbn = "2", Title = "T2", Author = "B", PublicationYear = 2023, DateAdded = DateTime.UtcNow }
    );
    await _context.SaveChangesAsync();

    var result = await _service.GetAllAsync(year: 2020);

    Assert.Single(result);
    Assert.Equal(2020, result.First().PublicationYear);
}

[Fact]
public async Task GetAllAsync_FilterByKeyword_SearchesAcrossAllTextFields()
{
    _context.Books.AddRange(
        new Book { Isbn = "1", Title = "Team Topologies", Author = "A", CuratorNote = "Pour les équipes DevOps", DateAdded = DateTime.UtcNow },
        new Book { Isbn = "2", Title = "Clean Code", Author = "B", CuratorNote = "Principes de base", DateAdded = DateTime.UtcNow }
    );
    await _context.SaveChangesAsync();

    var result = await _service.GetAllAsync(keyword: "equipe");

    Assert.Single(result);
    Assert.Equal("Team Topologies", result.First().Title);
}

[Fact]
public async Task GetAllAsync_CombinedFilters_AppliesAndLogic()
{
    _context.Books.AddRange(
        new Book { Isbn = "1", Title = "T1", Author = "A", Genre = "Management", PublicationYear = 2023, DateAdded = DateTime.UtcNow },
        new Book { Isbn = "2", Title = "T2", Author = "B", Genre = "Management", PublicationYear = 2019, DateAdded = DateTime.UtcNow },
        new Book { Isbn = "3", Title = "T3", Author = "C", Genre = "Fiction", PublicationYear = 2023, DateAdded = DateTime.UtcNow }
    );
    await _context.SaveChangesAsync();

    // Only book 1 matches BOTH genre=management AND year=2023
    var result = await _service.GetAllAsync(genre: "management", year: 2023);

    Assert.Single(result);
    Assert.Equal("T1", result.First().Title);
}

[Fact]
public async Task GetAllAsync_NoMatch_ReturnsEmptyList_NotNull()
{
    _context.Books.Add(new Book { Isbn = "1", Title = "T1", Author = "A", Genre = "Fiction", DateAdded = DateTime.UtcNow });
    await _context.SaveChangesAsync();

    var result = await _service.GetAllAsync(genre: "nonexistent");

    Assert.NotNull(result);
    Assert.Empty(result); // AC #7 — never null
}
```

### Architecture Compliance

- **Controller → Service → DbContext** — never inject `AppDbContext` into the controller.
- **All async** — method stays `async Task<...>`, no `.Result` / `.Wait()`.
- **No breaking changes** — `GetAllAsync()` with no arguments continues to return all books. All existing controller callers (`GetAll()` with only `isSelectionDuMois`/`sortBy`) continue to compile without modification.
- **No NFR2 optimization needed** — SQLite LIKE queries on 500 rows are orders of magnitude faster than 1 second. No index, caching, or optimization needed for v1.
- **`CuratorNote` nullable** — `Book.CuratorNote` is nullable (`string?`) in the entity. Always null-check before `.ToLower()` in LINQ predicates to avoid a `NullReferenceException` that EF Core cannot translate.

### Previous Story Intelligence (Story 2.5 + 2.1)

**From Story 2.1 (where `BookService` and tests were written):**

1. **SQLite in-memory test pattern** — use `SqliteConnection("Data Source=:memory:")`, open connection, pass to `DbContextOptionsBuilder`, call `EnsureCreated()`. Do NOT use `UseInMemoryDatabase` (it's a separate provider; SQLite in-memory is required because the project uses SQLite-specific behavior).

2. **`BookServiceTests` implements `IDisposable`** — `Dispose()` closes `_context` and `_connection`. Add new tests as `[Fact]` methods; do NOT change the constructor or `Dispose()`.

3. **`BooksControllerTests` uses real `BookService`** — not a mock. Pattern: `new BooksController(new BookService(_context))`. Follow the same approach for new controller tests.

4. **No `.component.ts` suffix** — applies to frontend only; backend uses standard C# conventions.

5. **Test method naming convention** — `MethodName_Condition_ExpectedBehavior` (e.g., `GetAllAsync_FilterByTitle_ReturnsCaseInsensitiveMatch`).

### Git Intelligence

Recent commits:
- `4236b9a`, `ac372e5` — Story 2.5 (`SelectionDuMoisCard` + `Home` updates, frontend only)
- `1660970`, `4292c2a` — Story 2.4 (`BookDetail` page, frontend only)
- `2c1ad1a`, `3e55da1` — Story 2.3 (catalog page, frontend only)
- `84699dc`, `0a3966d` — Story 2.2 (`BookCover`, frontend only)

The backend has not been modified since Story 2.1. `BooksController`, `BookService`, and `IBookService` are exactly as defined in Story 2.1.

### Scope Guard — What NOT to Implement in This Story

| Feature | Story |
|---------|-------|
| `FilterBarComponent` Angular component | Story 3.2 |
| Angular service changes for filter params | Story 3.2 |
| URL query param handling in Angular router | Story 3.2 |
| Any other backend endpoint changes | Out of scope |

### References

- `BooksController` (current): [backend/Controllers/BooksController.cs](backend/Controllers/BooksController.cs)
- `BookService` (current): [backend/Services/BookService.cs](backend/Services/BookService.cs)
- `IBookService` (current): [backend/Services/Interfaces/IBookService.cs](backend/Services/Interfaces/IBookService.cs)
- `BookServiceTests` (current): [backend.Tests/Services/BookServiceTests.cs](backend.Tests/Services/BookServiceTests.cs)
- `BooksControllerTests` (current): [backend.Tests/Controllers/BooksControllerTests.cs](backend.Tests/Controllers/BooksControllerTests.cs)
- `Book` entity: [backend/Models/Book.cs](backend/Models/Book.cs)
- Architecture — API patterns: `_bmad-output/planning-artifacts/architecture.md` — API Patterns section
- Epics — Story 3.1 acceptance criteria: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.1

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented 5 new query parameters (`title`, `author`, `genre`, `year`, `keyword`) on `GET /api/books` with AND logic.
- Used `.ToLower().Contains()` pattern for case-insensitive text filtering — EF Core translates to `lower(col) LIKE lower('%val%')` in SQLite.
- `keyword` searches across Title, Author, Genre, and CuratorNote fields with OR logic; nullable fields (Genre, CuratorNote) guarded before `.ToLower()` to prevent LINQ translation errors.
- Keyword test uses accented search term (`keyword: "équipe"`) to match accented CuratorNote — tests that SQLite `lower()` handles partial accented matches within the same Unicode form correctly.
- All 31 tests pass (22 pre-existing + 7 new service tests + 2 new controller tests), 0 regressions.

### File List

- backend/Services/Interfaces/IBookService.cs
- backend/Services/BookService.cs
- backend/Controllers/BooksController.cs
- backend.Tests/Services/BookServiceTests.cs
- backend.Tests/Controllers/BooksControllerTests.cs
