
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
       
    )
);

            // Identity
            builder.Services.AddIdentity<AccountUser, IdentityRole>()
                .AddEntityFrameworkStores<WatchKidsDBContext>()
                .AddDefaultTokenProviders();


            builder.Services.AddAuthentication();
            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            var app = builder.Build();
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();
            app.Run();
        }
    }
}
