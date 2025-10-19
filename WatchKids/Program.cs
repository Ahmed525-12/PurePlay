
using Dashboard.Handler.ServicesExtension;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Infastrcutre;

namespace WatchKids
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddDbContext<WatchKidsDBContext>(options =>
                    options.UseSqlServer(
                            builder.Configuration.GetConnectionString("DefaultConnection")
                                                    ));
            builder.Services.AddIdentity<AccountUser, IdentityRole>()
                .AddEntityFrameworkStores<WatchKidsDBContext>()
                .AddDefaultTokenProviders();


            builder.Services.AddIdentityServices(builder.Configuration);
            builder.Services.AddAplicationServices();


            builder.Services.AddAuthentication();
            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });

                var securityScheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Description = "Enter JWT Bearer token in the format: Bearer {your token}",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                };

                c.AddSecurityDefinition("Bearer", securityScheme);

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            // put the scheme defined above into the requirement
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
            }); var app = builder.Build();
            app.UseSwagger();
            app.UseSwaggerUI();
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapAllAllergens();
            app.Run();
        }
    }
}
