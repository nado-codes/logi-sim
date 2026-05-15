public class LocationItemDTO : BaseItemDTO
{
    public Recipe Recipe { get; set; }
    public LocationType LocationType { get; set; }
}

/*

    recipe: {
    inputs: Record<string,number>;
    outputs: Record<string,number>;
  };
  locationType: LOCATION_TYPE;

*/