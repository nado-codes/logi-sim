public class ContractDTO : CompanyEntityDTO
{
    public string SupplierId { get; set; }
    public string DestinationId { get; set; }
    public string? TruckId { get; set; }
    public ResourceType resourceType { get; set; }
    public int TotalAmount { get; set; }
    public int Payment { get; set; }
    public int ExpectedTick { get; set; }
    public int? DeliveredTick { get; set; }
    public int? AcceptedAtTick { get; set; }
}