#nullable enable

public class ContractDTO : CompanyEntityDTO
{
    public string? ShipperId {get; set;}
    public string SupplierId { get; set; } = default!;
    public string DestinationId { get; set; } = default!;
    public string? TruckId { get; set; }
    public ResourceType ResourceType { get; set; }
    public int DeliveredAmount { get; set; }
    public int TotalAmount { get; set; }
    public float Payment { get; set; }
    public int ExpectedTick { get; set; }
    public int? DeliveredTick { get; set; }
    public int? AcceptedAtTick { get; set; }
}