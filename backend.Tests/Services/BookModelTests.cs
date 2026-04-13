using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Models.DTOs;
using Xunit;

namespace backend.Tests.Services;

// Story 1.1 — verifies the data model is correctly defined (FR34, FR35)
public class BookModelTests
{
    [Fact]
    public void Book_HasAllFR34Fields()
    {
        // All FR34 fields must be present on the Book entity
        var book = new Book
        {
            Id = 1,
            Isbn = "978-0-13-235088-4",
            Title = "An Elegant Puzzle",
            Author = "Will Larson",
            Genre = "Management",
            PublicationYear = 2019,
            CoverImageUrl = "https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg",
            CuratorNote = "Incontournable pour les tech leads.",
            DateAdded = DateTime.UtcNow, // FR35: auto-set in BookService.CreateAsync
            IsSelectionDuMois = true,
            Status = "available" // FR26: forward-compat field
        };

        Assert.Equal("978-0-13-235088-4", book.Isbn);
        Assert.Equal("An Elegant Puzzle", book.Title);
        Assert.Equal("Will Larson", book.Author);
        Assert.Equal("Management", book.Genre);
        Assert.Equal(2019, book.PublicationYear);
        Assert.NotNull(book.CoverImageUrl);
        Assert.NotNull(book.CuratorNote);
        Assert.True(book.IsSelectionDuMois);
        Assert.Equal("available", book.Status);
    }

    [Fact]
    public void Book_DefaultStatus_IsAvailable()
    {
        // FR26: status defaults to "available" without explicit assignment
        var book = new Book();
        Assert.Equal("available", book.Status);
    }

    [Fact]
    public void AdminUser_HasRequiredFields()
    {
        var admin = new AdminUser
        {
            Id = 1,
            Username = "admin",
            PasswordHash = "$2a$11$examplehash"
        };

        Assert.Equal("admin", admin.Username);
        Assert.StartsWith("$2a$", admin.PasswordHash); // BCrypt hash prefix
    }

    [Fact]
    public void BookDto_MatchesBookEntityFields()
    {
        // BookDto must expose all FR34 fields for API responses
        var dto = new BookDto
        {
            Id = 1,
            Isbn = "978-0-13-235088-4",
            Title = "An Elegant Puzzle",
            Author = "Will Larson",
            Genre = "Management",
            PublicationYear = 2019,
            CoverImageUrl = null,
            CuratorNote = null,
            DateAdded = DateTime.UtcNow,
            IsSelectionDuMois = false,
            Status = "available"
        };

        Assert.Equal("978-0-13-235088-4", dto.Isbn);
        Assert.Null(dto.CoverImageUrl); // nullable fields allowed
        Assert.Null(dto.CuratorNote);  // nullable fields allowed
        Assert.Equal("available", dto.Status);
    }
}
