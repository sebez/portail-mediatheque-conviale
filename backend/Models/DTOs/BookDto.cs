namespace PortailMediatheque.Api.Models.DTOs;

// Response DTO — camelCase JSON via System.Text.Json default (never override)
public class BookDto
{
    public int Id { get; set; }
    public string Isbn { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int PublicationYear { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? CuratorNote { get; set; }
    public DateTime DateAdded { get; set; }
    public bool IsSelectionDuMois { get; set; }
    public string Status { get; set; } = "available";
}
