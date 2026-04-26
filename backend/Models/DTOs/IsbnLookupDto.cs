namespace PortailMediatheque.Api.Models.DTOs;

// Partial metadata returned by ISBN lookup — all fields nullable (Open Library or Google Books may return partial data)
// Never returned as null from IsbnService — always at minimum { isbn: "..." }
public class IsbnLookupDto
{
    public string Isbn { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Author { get; set; }
    public string? Genre { get; set; }
    public int? PublicationYear { get; set; }
    public string? CoverImageUrl { get; set; }
}
