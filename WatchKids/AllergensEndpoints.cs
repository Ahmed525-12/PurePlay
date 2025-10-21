using Dashboard.API.EndPoints.AuthAccount;
using WatchKids.EndPoints.YoutubeVideo;

namespace WatchKids
{
    public static class AllergensEndpoints
    {
        public static WebApplication MapAllAllergens(this WebApplication app)
        {
            app.MapUserAllergens();
            app.MapAllYTVEndPoints();

            return app;
        }
    }
}
