using Microsoft.AspNetCore.Mvc;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Controllers;

[ApiController]
[Route("[controller]")]  // → /books (nginx strips /api; Angular dev calls :5000/books directly)
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    // GET /books  or  GET /books?isSelectionDuMois=true  or  GET /books?sortBy=dateAdded
    // No [Authorize] — public endpoint (AC #1, #5, #6)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookDto>>> GetAll(
        [FromQuery] bool? isSelectionDuMois = null,
        [FromQuery] string? sortBy = null)
    {
        var books = await _bookService.GetAllAsync(isSelectionDuMois, sortBy);
        return Ok(books);
    }

    // GET /books/{id}
    // No [Authorize] — public endpoint (AC #3, #4)
    [HttpGet("{id}")]
    public async Task<ActionResult<BookDto>> GetById(int id)
    {
        var book = await _bookService.GetByIdAsync(id);
        if (book is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: $"Book with id {id} was not found."
            );
        return Ok(book);
    }
}
