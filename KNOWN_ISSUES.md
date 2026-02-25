v0.3.2

MAJOR:

- x

MINOR:

- Notifications no longer work as intended. "Log(success/error/info/warning)" get cleared whenever the menu refreshes, rendering the system "notifications" inoperable. To fix it, we need to store notifications in a buffer between ticks, and allow the player to view them from the main menu in a dedicated page
