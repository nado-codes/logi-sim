v0.5.0

MAJOR:

- if locations (e.g. towns) are supplied too quickly (e.g. really fast trucks), the towns get super greedy and population spirals out of control - and the factories can't supply the town - entire economy collapses

MINOR:

- Notifications no longer work as intended. "Log(success/error/info/warning)" get cleared whenever the menu refreshes, rendering the system "notifications" inoperable. To fix it, we need to store notifications in a buffer between ticks, and allow the player to view them from the main menu in a dedicated page
- Storing object references in objects is bad for garbage collection and causes memory leaks. better to use "id" and
  "get" methods to fetch them. and once performance becomes an issue, implement caching/hash maps to make fetching more efficient
