using System;
using System.ComponentModel.DataAnnotations;
using Dashboard.Domain.DTOs.AuthDTOs;
using Dashboard.Handler.JWTToken.Intrefaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Handler.Response;

namespace Dashboard.API.EndPoints.AuthAccount;

public static class LoginEmailEndPoint
{
    public static async Task<IResult> Handler(
        [FromBody] LoginEmailDtoReq loginDtoReq,
        UserManager<AccountUser> userManager,
        SignInManager<AccountUser> signInManager,
        ITokenService tokenService
    )
    {
        try
        {
            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(loginDtoReq);

            bool isValid = Validator.TryValidateObject(loginDtoReq, validationContext, validationResults, true);

            if (!isValid)
            {
                var errors = validationResults.Select(vr => vr.ErrorMessage).ToList();
                var errorMessage = string.Join("; ", errors);
                return Results.BadRequest(Result<LoginDtoRes>.Fail(errorMessage));
            }

            // Check for wrong datatypes
            if (string.IsNullOrWhiteSpace(loginDtoReq.Email) || !loginDtoReq.Email.Contains("@"))
            {
                return Results.BadRequest(Result<LoginDtoRes>.Fail("Invalid email format"));
            }

            if (string.IsNullOrWhiteSpace(loginDtoReq.Password))
            {
                return Results.BadRequest(Result<LoginDtoRes>.Fail("Password cannot be empty"));
            }

            // Check if user exists
            var checkUser = await userManager.FindByEmailAsync(loginDtoReq.Email);
            if (checkUser == null)
            {
                return Results.BadRequest(Result<LoginDtoRes>.Fail("User not found"));
            }

            // Validate password
            var result = await signInManager.CheckPasswordSignInAsync(checkUser, loginDtoReq.Password, false);
            if (!result.Succeeded)
            {
                return Results.BadRequest(Result<LoginDtoRes>.Fail("Invalid credentials"));
            }

            // Generate token and refresh token
                var token = await tokenService.CreateToken(checkUser);

            // Prepare response
            var loginDtoRes = new LoginDtoRes
            {
                Email = checkUser.Email,
                Token = token,
            };

            return Results.Ok(Result<LoginDtoRes>.Ok(loginDtoRes));
        }
        catch (DbUpdateException ex)
        {
            return Results.Ok( Result<LoginDtoRes>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return Results.Ok( Result<LoginDtoRes>.Fail(ex.Message));
        }
    }
}
