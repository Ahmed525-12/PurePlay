using System;

namespace Dashboard.Domain.DTOs.AuthDTOs;

public class LoginDtoRes
{
 public string? Email { get; set; }
 public string Token { get; set; }= default!;
}

