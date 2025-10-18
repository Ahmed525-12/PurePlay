using System;
using System.ComponentModel.DataAnnotations;
using Dashboard.Domain.DTOs.AuthDTOs;
using Dashboard.Handler.JWTToken.Intrefaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Handler.Mapps;
using WatchKids.WatchKids.Handler.Response;

namespace Dashboard.API.EndPoints.AuthAccount;

public static class RegisterEndPoint
{
    public static async Task<IResult> Handler(
        [FromServices] ITokenService        tokenService,
        [FromServices] UserManager<AccountUser> userManager,
        [FromBody]     RegistoerDtoReq      registerDtoReq)
    {
        try
        {
            // 1️⃣ Validate the incoming DTO
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(registerDtoReq);
            if (!Validator.TryValidateObject(registerDtoReq, validationContext, validationResults, true))
            {
                var errors = validationResults.Select(v => v.ErrorMessage).ToList();
                return Results.BadRequest(Result<RegistoerDtoRes>.Fail(string.Join("; ", errors)));
            }

            // Check for wrong datatypes
            if (string.IsNullOrWhiteSpace(registerDtoReq.Email) || !registerDtoReq.Email.Contains("@"))
            {
                return Results.BadRequest(Result<RegistoerDtoRes>.Fail("Invalid email format."));
            }

            if (string.IsNullOrWhiteSpace(registerDtoReq.Password))
            {
                return Results.BadRequest(Result<RegistoerDtoRes>.Fail("Password cannot be empty."));
            }

            // 2️⃣ Check email uniqueness
            if (await userManager.FindByEmailAsync(registerDtoReq.Email) != null)
            {
                return Results.BadRequest(Result<RegistoerDtoRes>.Fail("Email is already taken."));
            }

        
            var account = AuthMapping.ToAccountFromRegisterReq(registerDtoReq);

            // 5️⃣ Create the user
            var createResult = await userManager.CreateAsync(account, registerDtoReq.Password);
            if (!createResult.Succeeded)
            {
                var errs = string.Join(", ", createResult.Errors.Select(e => e.Description));
                return Results.BadRequest(Result<RegistoerDtoRes>.Fail(errs));
            }

         

            // 7️⃣ Issue tokens
            var jwt        = await tokenService.CreateToken(account);

            // 8️⃣ Build response
            var resDto = new RegistoerDtoRes
            {
                Email        = account.Email,
                Token        = jwt,
            };

            return Results.Ok(Result<RegistoerDtoRes>.Ok(resDto));
        }
        catch (Exception ex)
        {
            // unexpected
            return Results.Problem(ex.Message);
        }
    }
}