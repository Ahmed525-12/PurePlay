using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Handler.Response;

namespace WatchKids.EndPoints.AuthAccount
{
    public class CheckPasswordEndPoint
    {
        public static async Task<IResult> Handler(
           [FromBody] CheckPasswordRequest checkPasswordModel,
           UserManager<AccountUser> userManager,
           HttpContext httpContext
       )
        {
            try
            {
                // Validate input
                var validationResults = new List<ValidationResult>();
                var validationContext = new ValidationContext(checkPasswordModel);
                bool isValid = Validator.TryValidateObject(checkPasswordModel, validationContext, validationResults, true);

                if (!isValid)
                {
                    var errors = validationResults.Select(vr => vr.ErrorMessage).ToList();
                    var errorMessage = string.Join("; ", errors);
                    return Results.BadRequest(Result<string>.Fail(errorMessage));
                }

                // Get email from JWT claims
                var email = httpContext.User.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(email))
                {
                    return Results.Unauthorized();
                }

                // Find user
                var user = await userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return Results.NotFound(Result<string>.Fail($"User '{email}' not found."));
                }

                // Change password (requires current password)
                var changePassResult = await userManager.CheckPasswordAsync(
                    user,
                    checkPasswordModel.Password
                  
                );

                if (!changePassResult)
                {
                   
                    return Results.BadRequest(Result<string>.Fail("Password Incorrect"));
                }

                return Results.Ok(Result<string>.Ok("Password Check successfully."));
            }
            catch (DbUpdateException ex)
            {
                return Results.BadRequest(Result<string>.Fail(ex.InnerException?.Message ?? ex.Message));
            }
            catch (Exception ex)
            {
                return Results.BadRequest(Result<string>.Fail(ex.Message));
            }
        }
    }
}
