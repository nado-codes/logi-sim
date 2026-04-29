public class ContractDTO : CompanyEntityDTO
{
    public string SupplierId { get; set; }
    public string DestinationId { get; set; }

#nullable enable
    public string? TruckId { get; set; }
#nullable disable
    public ResourceType resourceType { get; set; }
    public int TotalAmount { get; set; }
    public int Payment { get; set; }
    public int ExpectedTick { get; set; }
    public int? DeliveredTick { get; set; }
    public int? AcceptedAtTick { get; set; }
}