public struct NotificationConfig
{
    public LogUINotificationsConfig logUINotifications;

    public struct LogUINotificationsConfig
    {
        public ActionsConfig actions;

        public struct ActionsConfig
        {
            public bool Create { get; set; }
            public bool Execute { get; set; }
        }
    }
}