using Dashboard.Domain.DTOs.AuthDTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Handler.Response;
using WatchKids.WatchKids.Infastrcutre;

namespace WatchKids.EndPoints.YoutubeVideo
{
    public static class AddYTVEndPoint
    {
        public static async Task<IResult> Handler([FromBody] AddYTVRequest request, WatchKidsDBContext dBContext, HttpContext httpContext, [FromServices] UserManager<AccountUser> userManager, IHttpClientFactory httpClientFactory)
        {
          try
            {
                if (request == null)
                {
                    return Results.BadRequest(Result<IResult>.Fail("url is empty !"));
                }

                // 1) Model validation
                var validationResults = new List<ValidationResult>();
                if (!Validator.TryValidateObject(request, new ValidationContext(request), validationResults, true))
                {
                    var errors = validationResults
                        .Select(v => v.ErrorMessage)
                        .Where(msg => !string.IsNullOrWhiteSpace(msg));
                    return Results.BadRequest(
                        Result<IResult>.Fail(string.Join("; ", errors))
                    );
                }

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

                // 4) Check if video already exists
                var existingVideo = await dBContext.YTVideos
                    .FirstOrDefaultAsync(v => v.Video_url == request.YTVUrl && v.AccountUserId == user.Id);

                if (existingVideo != null)
                {
                    return Results.BadRequest(
                        Result<IResult>.Fail("This video is already added to your list.")
                    );
                }

                // 5) Fetch video details from YouTube
                var http = httpClientFactory.CreateClient();
                var oembed = $"https://www.youtube.com/oembed?url={Uri.EscapeDataString(request.YTVUrl)}&format=json";

                using var resp = await http.GetAsync(oembed).ConfigureAwait(false);

                if (!resp.IsSuccessStatusCode)
                {
                    return Results.BadRequest(
                        Result<IResult>.Fail("Failed to fetch video details from YouTube. Please check the URL.")
                    );
                }

                // 6) Parse YouTube response
                var j = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(j);
                var root = doc.RootElement;

                var YTVideo = new YTVideo
                {
                    Title = root.TryGetProperty("title", out var t) ? t.GetString() ?? string.Empty : string.Empty,
                    Author_Name = root.TryGetProperty("author_name", out var a) ? a.GetString() ?? string.Empty : string.Empty,
                    Thumbnail_url = root.TryGetProperty("thumbnail_url", out var th) ? th.GetString() ?? string.Empty : string.Empty,
                    Video_url = request.YTVUrl,
                    AccountUserId = user.Id
                };

                // 7) Add to database
                await dBContext.YTVideos.AddAsync(YTVideo);
                await dBContext.SaveChangesAsync();
                var response = new YTVideoResponse
                {
                    Id = YTVideo.Id,
                    Title = YTVideo.Title,
                    Author_Name = YTVideo.Author_Name,
                    Thumbnail_url = YTVideo.Thumbnail_url,
                    Video_url = YTVideo.Video_url
                };
                return Results.Ok(Result<YTVideoResponse>.Ok(response));
            }
            catch (DbUpdateException ex)
            {
                return Results.Ok(Result<YTVideoResponse>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                return Results.Ok(Result<YTVideoResponse>.Fail(ex.Message));
            }
        }
    }
}