using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WatchKids.WatchKids.Domain;

namespace WatchKids.WatchKids.Infastrcutre
{
    public class WatchKidsDBContext : IdentityDbContext<AccountUser>
    {
        public WatchKidsDBContext(DbContextOptions<WatchKidsDBContext> dbContextOptions): base(dbContextOptions)
        {

        }
       
        public DbSet<YTVideo> YTVideos { get; set; } = default!;

        public DbSet<AccountUser> AccountUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<YTVideo>()
                .HasOne(y => y.AccountUser)
                .WithMany(a => a.YTVideos)
                .HasForeignKey(y => y.AccountUserId);
        }
    }
}
