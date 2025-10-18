using Dashboard.Domain.DTOs.AuthDTOs;
using WatchKids.WatchKids.Domain;

namespace WatchKids.WatchKids.Handler.Mapps
{
    public static class AuthMapping
    {
        public static AccountUser ToAccountFromRegisterReq(this RegistoerDtoReq req)
        {


            return new AccountUser
            {
                Email = req.Email,
                UserName = req.Email.Split('@')[0],
            };
        }
    }
}
