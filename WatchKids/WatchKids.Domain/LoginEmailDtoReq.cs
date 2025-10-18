using System;
using System.ComponentModel.DataAnnotations;

namespace Dashboard.Domain.DTOs.AuthDTOs;

public class LoginEmailDtoReq
{
 [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email invalid")]
    public string Email { get; set; } = default!;
    [Required(ErrorMessage = "password is required")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = default!;}
