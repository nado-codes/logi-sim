public class LocationItemViewModel : BaseItemViewModel
{
    public string LocationTypeName { get; set; }
    public RecipeViewModel Recipe { get; set; }

    public static LocationItemViewModel FromDTO(LocationItemDTO dto)
    {
        return new LocationItemViewModel
        {
            Id = dto.Id,
            Name = dto.Name,
            Price = dto.Price.ToString("C"),
            LocationTypeName = dto.LocationType.ToString(),
            Recipe =  RecipeViewModel.FromDTO(dto.Recipe)
        };
    }
}