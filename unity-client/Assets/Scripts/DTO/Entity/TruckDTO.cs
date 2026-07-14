
public class TruckDTO : WorldEntityDTO, ICompanyEntity, IMarketplaceEntity
{
    public string CompanyId { get; set; }
    public StorageDTO Storage { get; set; }
    public string DestinationId { get; set; }

    public string ContractId { get; set; }

    public string ItemId { get; set; }
}