v0.1.6

MAJOR:

- x

MINOR:

- Contract creation code for Consumer + Producer violates "DRY" principle (basically does the same thing, but still written as if it's two separate processes). Create a method in the same place as "findClosestSupplier"
  and make producers & consumers route through the new method
- The current truck never delivers metal to Town A, even though it's practically screaming for it (although
  this could literally be by design since the truck's storage can only take ore, so we may just need to make
  another truck lol)
