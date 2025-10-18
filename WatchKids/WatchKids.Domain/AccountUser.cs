using Microsoft.AspNetCore.Identity;

namespace WatchKids.WatchKids.Domain
{
    public class AccountUser : IdentityUser
    {
        public List<YTVideo> YTVideos { get; set; } = [];
    }
}
