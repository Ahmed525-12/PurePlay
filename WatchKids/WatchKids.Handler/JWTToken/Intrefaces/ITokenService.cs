
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WatchKids.WatchKids.Domain;


namespace Dashboard.Handler.JWTToken.Intrefaces
{
    public interface ITokenService
    {
        public Task<string> CreateToken(AccountUser user);
    }
}