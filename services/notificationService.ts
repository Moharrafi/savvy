export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png', // Generic wallet icon
        silent: false,
      });
    } catch (e) {
      console.error("Error sending notification", e);
    }
  }
};