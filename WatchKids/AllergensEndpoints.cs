using Dashboard.API.EndPoints.AuthAccount;

namespace WatchKids
{
    public static class AllergensEndpoints
    {
        public static WebApplication MapAllAllergens(this WebApplication app)
        {
            app.MapUserAllergens();


            return app;
        }
    }
}
