using Microsoft.AspNetCore.Authorization;
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
    // GET /books?title=...&author=...&genre=...&year=...&keyword=...
    // No [Authorize] — public endpoint (AC #1, #5, #6)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookDto>>> GetAll(
        [FromQuery] bool? isSelectionDuMois = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? title = null,
        [FromQuery] string? author = null,
        [FromQuery] string? genre = null,
        [FromQuery] int? year = null,
        [FromQuery] string? keyword = null)
    {
        var books = await _bookService.GetAllAsync(
            isSelectionDuMois, sortBy, title, author, genre, year, keyword);
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

    // POST /books
    // [Authorize] — admin only (AC #6)
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BookDto>> Create([FromBody] CreateBookRequest request)
    {
        var book = await _bookService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
    }

    // PUT /books/{id}
    // [Authorize] — admin only (AC #6)
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<BookDto>> Update(int id, [FromBody] UpdateBookRequest request)
    {
        var book = await _bookService.UpdateAsync(id, request);
        if (book is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: $"Book with id {id} was not found."
            );
        return Ok(book);
    }

    // DELETE /books/{id}
    // [Authorize] — admin only (AC #6)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _bookService.DeleteAsync(id);
        if (!deleted)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found",
                detail: $"Book with id {id} was not found."
            );
        return NoContent();
    }
}
