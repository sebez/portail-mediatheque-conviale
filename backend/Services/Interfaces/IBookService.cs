using PortailMediatheque.Api.Models.DTOs;

namespace PortailMediatheque.Api.Services.Interfaces;

// Implemented in Stories 2.1, 5.1
public interface IBookService
{
    Task<IEnumerable<BookDto>> GetAllAsync(bool? isSelectionDuMois = null, string? sortBy = null);
    Task<BookDto?> GetByIdAsync(int id);
    Task<BookDto> CreateAsync(CreateBookRequest request);
    Task<BookDto?> UpdateAsync(int id, UpdateBookRequest request);
    Task<bool> DeleteAsync(int id);
}
