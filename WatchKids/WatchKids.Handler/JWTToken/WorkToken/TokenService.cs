
using Dashboard.Handler.JWTToken.Intrefaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WatchKids.WatchKids.Domain;
using WatchKids.WatchKids.Infastrcutre;

namespace Dashboard.Handler.JWTToken.WorkToken
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly UserManager<AccountUser> _accountManager;
        private readonly WatchKidsDBContext _db;

        public TokenService(IConfiguration configuration, UserManager<AccountUser> accountManager, WatchKidsDBContext db)
        {
            _configuration = configuration;
            _accountManager = accountManager;
            _db = db;
        }

        public async Task<string> CreateToken(AccountUser user)
        {
            // Fetch user roles from the account manager
            var roles = await _accountManager.GetRolesAsync(user);
            // Claims
            var UserClaim = new List<Claim>()
            {
                new Claim(ClaimTypes.Email, user.Email),
            };
            // Add role claims
            if (roles != null)
            {
                foreach (var role in roles)
                {
                    UserClaim.Add(new Claim(ClaimTypes.Role, role));
                }
            }

            // Security Key
            var Key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Key"]));

            // Create Token Object
            var Token = new JwtSecurityToken(
                issuer: _configuration["JWT:Issuer"],
                audience: _configuration["JWT:Audience"],
                expires: DateTime.Now.AddDays(double.Parse(_configuration["JWT:Expire"])),
                claims: UserClaim,
                signingCredentials: new SigningCredentials(Key, SecurityAlgorithms.HmacSha256Signature)
                );

            return new JwtSecurityTokenHandler().WriteToken(Token);
        }
    }
}