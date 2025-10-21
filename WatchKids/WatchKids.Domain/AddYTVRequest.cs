using System.ComponentModel.DataAnnotations;

namespace WatchKids.WatchKids.Domain
{
    public class AddYTVRequest
    {
        [Required]
        public string YTVUrl { get; set; } 
    }
}
