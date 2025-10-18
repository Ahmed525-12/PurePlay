using Microsoft.AspNetCore.Builder;
using System;

namespace Dashboard.API.EndPoints.AuthAccount;

public static class UserAllEndPoints
{

    public static IEndpointRouteBuilder MapUserAllergens(this IEndpointRouteBuilder app)
    {
         var userAllergensGroup = app.MapGroup("/v1/Auth").WithTags("Auth");
        userAllergensGroup.MapPost("/Register",RegisterEndPoint.Handler)
            .WithName("Register");
        userAllergensGroup.MapPost("/Login/Email",LoginEmailEndPoint.Handler)
            .WithName("LoginWithEmail");
       
            
        return app;
    }

}
