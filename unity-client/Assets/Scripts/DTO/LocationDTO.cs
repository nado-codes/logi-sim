
public class LocationDTO : WorldEntityDTO, ICompanyEntity
{
    public string companyId { get; set; }
    public LocationType locationType { get; set; }
    public StorageDTO[] storage { get; set; }
}