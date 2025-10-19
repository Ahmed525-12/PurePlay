namespace WatchKids.WatchKids.Domain
{
    public class ResetPasswordRequest
    {
        public string CurrentPassword { get; set; } = default!;
        public string NewPassword { get; set; } = default!;
    }
}
