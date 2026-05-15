
public class LocationDTO : WorldEntityDTO, ICompanyEntity
{
    public string CompanyId { get; set; }
    public LocationType LocationType { get; set; }
    public StorageDTO[] storage { get; set; }
}