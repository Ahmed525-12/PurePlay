using Dashboard.API.EndPoints.AuthAccount;
using WatchKids.EndPoints.AuthAccount;

namespace WatchKids.EndPoints.YoutubeVideo
{
    public static class YoutubeVideoAllEndPoints
    {

        public static IEndpointRouteBuilder MapAllYTVEndPoints(this IEndpointRouteBuilder app)
        {
            var MapAllYTVGroup = app.MapGroup("/v1/YTV").WithTags("YTV").RequireAuthorization();
            MapAllYTVGroup.MapPost("/AddYTV", AddYTVEndPoint.Handler)
                .WithName("AddYTV");
            MapAllYTVGroup.MapGet("/GetAllYTV", GetAllYTVEndPoint.Handler)
                .WithName("GetAllYTV");
            MapAllYTVGroup.MapGet("/GetbyIdYTV/{id}", GetbyIdYTVEndPoint.Handler)
               .WithName("GetbyIdYTV");
            MapAllYTVGroup.MapDelete("/DeleteYTV/{id}", DeleteYTVEndPoint.Handler)
         .WithName("DeleteYTV");

            return app;
        }

    }

}
