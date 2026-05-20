public class CompanyViewModel : BaseViewModel
{
    public string Money{get;set;}

    public static CompanyViewModel FromDTO(CompanyDTO dto)
    {
        return FromDTO(dto,() => {
            return new CompanyViewModel()
            {
                Id = dto.Id,
                Name = dto.Name,
                Money = dto.Money.ToString("C")
            };
        });
    }
}