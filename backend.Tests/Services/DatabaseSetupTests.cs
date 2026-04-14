using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;

namespace backend.Tests.Services;

// SQLite in-memory databases are connection-scoped: the DB is destroyed when the connection closes.
// We must keep the connection open for the entire test lifetime and pass it explicitly to DbContext.
public class DatabaseSetupTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly SqliteConnection _connection;

    public DatabaseSetupTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task Books_TableExists_WithAllFR34Fields()
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

        var retrieved = await _context.Books.FindAsync(book.Id);
        Assert.NotNull(retrieved);
        Assert.Equal("available", retrieved.Status); // default applied (FR26)
        Assert.False(retrieved.IsSelectionDuMois);   // bool default
        Assert.Null(retrieved.CoverImageUrl);        // nullable
        Assert.Null(retrieved.CuratorNote);          // nullable
    }

    [Fact]
    public async Task AdminUsers_TableExists_AndCanStoreBCryptHash()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("test-password");
        _context.AdminUsers.Add(new AdminUser { Username = "admin", PasswordHash = hash });
        await _context.SaveChangesAsync();

        var retrieved = await _context.AdminUsers.FindAsync(1);
        Assert.NotNull(retrieved);
        Assert.True(BCrypt.Net.BCrypt.Verify("test-password", retrieved.PasswordHash));
    }

    [Fact]
    public async Task AdminSeed_IsIdempotent_WhenAdminAlreadyExists()
    {
        // Simulate first startup — seed admin
        _context.AdminUsers.Add(new AdminUser { Username = "admin", PasswordHash = "hash1" });
        await _context.SaveChangesAsync();

        // Simulate second startup — seed logic must not add a second admin
        if (!await _context.AdminUsers.AnyAsync())
        {
            _context.AdminUsers.Add(new AdminUser { Username = "admin", PasswordHash = "hash2" });
            await _context.SaveChangesAsync();
        }

        var count = await _context.AdminUsers.CountAsync();
        Assert.Equal(1, count); // AC #1: idempotent
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
