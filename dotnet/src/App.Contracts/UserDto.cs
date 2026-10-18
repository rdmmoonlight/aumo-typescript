using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace App.Contracts;

/// <summary>Kontrak data pengguna yang dibagi lintas bahasa.</summary>
/// <param name="Id">Identitas unik pengguna.</param>
/// <param name="Name">Nama pengguna.</param>
/// <param name="Email">Alamat surel pengguna.</param>
public record UserDto(
    [property: JsonPropertyName("id"), Required] string Id,
    [property: JsonPropertyName("name"), Required, StringLength(100, MinimumLength = 2)] string Name,
    [property: JsonPropertyName("email"), Required, EmailAddress] string Email);
