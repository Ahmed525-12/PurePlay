using Azure.Core;
using Dashboard.Domain.DTOs.AuthDTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Handler.Response;
using WatchKids.WatchKids.Infastrcutre;

namespace WatchKids.EndPoints.YoutubeVideo
{
    public class GetAllYTVEndPoint
    {
        public static async Task<IResult> Handler( WatchKidsDBContext dBContext, HttpContext httpContext, [FromServices] UserManager<AccountUser> userManager)
        {

            try
            {
                // 2) Extract email claim
                var email = httpContext.User.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(email))
                {
                    return Results.BadRequest(
                        Result<IResult>.Fail("Missing email claim in token.")
                    );
                }

                // 3) Find user
                var user = await userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    return Results.NotFound(
                        Result<IResult>.Fail($"User '{email}' not found.")
                    );
                }

                var videos = await dBContext.YTVideos.Where(v => v.AccountUserId == user.Id).AsNoTracking().ToListAsync();

                if (videos == null || videos.Count == 0)
                {
                    return Results.NotFound(Result<List<YTVideo>>.Fail("No videos found for the user."));
                }
                return Results.Ok(Result<List<YTVideo>>.Ok(videos));
            }
            catch (DbUpdateException ex)
            {
                return Results.Ok(Result<List<YTVideo>>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                return Results.Ok(Result<List<YTVideo>>.Fail(ex.Message));
            }
        }
    }
}
