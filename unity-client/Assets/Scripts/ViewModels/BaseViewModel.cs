using System;

public abstract class BaseViewModel : IBaseEntity, INamedEntity
{
    public string Id { get; set; }
    public string Name { get; set; }

    protected static T FromDTO<T,D>(D data, Func<T> create) where T : BaseViewModel where D : BaseEntityDTO
    {
        if (data.Id == null)
            throw new ArgumentNullException(nameof(data.Id), "DTO missing required field: Id");

        var vm = create();
        vm.Id = data.Id;
        return vm;
    }
}