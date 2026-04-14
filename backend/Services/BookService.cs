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
