using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
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

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
