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

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
