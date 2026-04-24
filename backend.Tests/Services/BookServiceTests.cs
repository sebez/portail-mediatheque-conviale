using System.Net;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services;

namespace backend.Tests.Services;

// Story 2.1 — tests for BookService read methods (GetAllAsync, GetByIdAsync)
// SQLite in-memory databases are connection-scoped: the DB is destroyed when the connection closes.
// We must keep the connection open for the entire test lifetime and pass it explicitly to DbContext.
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
        _service = new BookService(_context,
            new FakeHttpClientFactory(new FakeHttpMessageHandler()));
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
        var book = new Book
        {
            Isbn = "978-0-13-235088-4",
            Title = "An Elegant Puzzle",
            Author = "Will Larson",
            Genre = "Management",
            PublicationYear = 2019,
            DateAdded = DateTime.UtcNow
        };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(book.Id);

        Assert.NotNull(result);
        Assert.Equal("An Elegant Puzzle", result.Title);
        Assert.Equal("978-0-13-235088-4", result.Isbn);
        Assert.Equal("Management", result.Genre);
        Assert.Equal(2019, result.PublicationYear);
    }

    [Fact]
    public async Task GetByIdAsync_UnknownId_ReturnsNull()
    {
        var result = await _service.GetByIdAsync(9999);

        Assert.Null(result); // Controller maps null → 404 (AC #4)
    }

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

        // Searches CuratorNote — accented search term matches accented text
        var result = await _service.GetAllAsync(keyword: "équipe");

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
        Assert.Empty(result);
    }

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

        Assert.Null(result.CoverImageUrl);
    }

    [Fact]
    public async Task CreateAsync_NullCoverUrl_StoresNull()
    {
        var request = new CreateBookRequest
        {
            Isbn = "333", Title = "T", Author = "A",
            CoverImageUrl = null
        };

        var result = await _service.CreateAsync(request);

        Assert.Null(result.CoverImageUrl);
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
        Assert.Equal(originalDateAdded, result.DateAdded);
    }

    [Fact]
    public async Task UpdateAsync_UnknownId_ReturnsNull()
    {
        var result = await _service.UpdateAsync(9999, new UpdateBookRequest
        {
            Isbn = "x", Title = "T", Author = "A", Status = "available"
        });

        Assert.Null(result);
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
        Assert.Null(found);
    }

    [Fact]
    public async Task DeleteAsync_UnknownId_ReturnsFalse()
    {
        var deleted = await _service.DeleteAsync(9999);

        Assert.False(deleted);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}

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
