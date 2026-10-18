namespace App.Contracts;

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public record UserDto(
    [property: JsonPropertyName("id"), Required] string Id,
    [property: JsonPropertyName("name"), Required, StringLength(100, MinimumLength = 2)] string Name,
    [property: JsonPropertyName("email"), Required, EmailAddress] string Email
);
