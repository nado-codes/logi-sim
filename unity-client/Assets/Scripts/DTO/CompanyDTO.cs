public class CompanyDTO : BaseEntityDTO, INamedEntity
{
    public string Name { get; set; }
    public float Money { get; set; }
    public CompanyDebtDTO[] Debts { get; set; }
    public bool IsInsolvent { get; set; }
    public bool IsLiquidated{ get; set; }
}