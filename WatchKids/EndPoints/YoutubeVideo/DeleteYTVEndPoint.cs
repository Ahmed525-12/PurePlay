using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Handler.Response;
using WatchKids.WatchKids.Infastrcutre;

namespace WatchKids.EndPoints.YoutubeVideo
{
    public class DeleteYTVEndPoint
    {
        public static async Task<IResult> Handler([FromRoute] int Id, WatchKidsDBContext dBContext, HttpContext httpContext, [FromServices] UserManager<AccountUser> userManager)
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

                var video = await dBContext.YTVideos.Where(v => v.AccountUserId == user.Id && v.Id == Id).AsNoTracking().FirstOrDefaultAsync();

                if (video == null)
                {
                    return Results.NotFound(Result<List<YTVideo>>.Fail("No video found for the user."));
                }
                dBContext.YTVideos.Remove(video);
                await dBContext.SaveChangesAsync();
                return Results.Ok(Result<string>.Ok("Delete Succesfully"));
            }
            catch (DbUpdateException ex)
            {
                return Results.Ok(Result<YTVideo>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                return Results.Ok(Result<YTVideo>.Fail(ex.Message));
            }
        }
    }
}
