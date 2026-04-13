using PortailMediatheque.Api.Models.DTOs;

namespace PortailMediatheque.Api.Services.Interfaces;

// Implemented in Story 6.1
// Open Library → Google Books fallback chain; NEVER throw on API failure
public interface IIsbnService
{
    Task<BookDto?> LookupAsync(string isbn);
}
