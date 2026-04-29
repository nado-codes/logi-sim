
public class TruckDTO : WorldEntityDTO, ICompanyEntity
{
    public string companyId { get; set; }
    public StorageDTO Storage { get; set; }
    public string DestinationId { get; set; }
}