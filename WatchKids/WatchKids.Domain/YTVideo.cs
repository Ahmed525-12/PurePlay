namespace WatchKids.WatchKids.Domain
{
    public class YTVideo
    {
        public int Id { get; set; }
        public string AccountUserId { get; set; } = default!;
        public string Video_url { get; set; } = default!;
        public string Title { get; set; } = default!;
        public string Author_Name { get; set; } = default!;
        public string Thumbnail_url { get; set; } = default!;
        public AccountUser AccountUser { get; set; } = default!;
    }
}
