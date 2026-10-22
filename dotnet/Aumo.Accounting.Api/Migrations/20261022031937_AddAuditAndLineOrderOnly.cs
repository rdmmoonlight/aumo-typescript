using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aumo.Accounting.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditAndLineOrderOnly : Migration
    {
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.RenameColumn(
                name: "line_order",
                table: "general-journal",
                newName: "LineOrder");

        }
    }
}
