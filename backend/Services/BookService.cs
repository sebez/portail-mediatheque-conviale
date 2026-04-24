using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Services;

public class BookService : IBookService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;

    public BookService(AppDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
    }

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

    public async Task<BookDto?> GetByIdAsync(int id)
    {
        var book = await _context.Books.FindAsync(id);
        return book is null ? null : MapToDto(book);
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
            return null;
        }
    }

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
