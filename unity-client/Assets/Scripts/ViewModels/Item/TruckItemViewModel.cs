public class TruckItemViewModel : BaseItemViewModel
{
    public string ResourceName { get; set; }
    public string ResourceCapacity{ get; set;}
    public float Speed { get; set; }

    public static TruckItemViewModel FromDTO(TruckItemDTO dto)
    {
        return new TruckItemViewModel
        {
            Id = dto.Id,
            Name = dto.Name,
            Price = dto.Price.ToString("C"),
            ResourceName = Utils.GetResourceTypeFromItemId(dto.ResourceItemId).ToString(),
            ResourceCapacity = dto.ResourceCapacity.ToString("N0"),
            Speed = dto.Speed
        };
    }
}