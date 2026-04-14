using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Controllers;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services;

namespace backend.Tests.Controllers;

// Story 2.1 — tests for BooksController public read endpoints
// Uses real BookService backed by in-memory SQLite (no mocking — consistent with project test style)
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
        var book = new Book
        {
            Isbn = "978-0-13-235088-4",
            Title = "An Elegant Puzzle",
            Author = "Will Larson",
            DateAdded = DateTime.UtcNow
        };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var result = await _controller.GetById(book.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<BookDto>(ok.Value);
        Assert.Equal("An Elegant Puzzle", dto.Title);
        Assert.Equal("978-0-13-235088-4", dto.Isbn);
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
