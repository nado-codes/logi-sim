
public class TruckDTO : WorldEntityDTO, ICompanyEntity
{
    public string CompanyId { get; set; }
    public StorageDTO Storage { get; set; }
    public string DestinationId { get; set; }
}