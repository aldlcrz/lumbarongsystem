const NOTIFICATION_ROUTE = "/notifications";

export function normalizeNotification(notification = {}) {
  return {
    ...notification,
    title: String(notification.title || "Notification"),
    message: String(notification.message || notification.desc || ""),
    type: String(notification.type || "general"),
    read: Boolean(notification.read ?? notification.isRead),
  };
}

export function getNotificationTypeKey(notification = {}) {
  const haystack = `${notification.type || ""} ${notification.title || ""} ${notification.message || ""}`.toLowerCase();

  if (haystack.includes("message") || haystack.includes("reply") || haystack.includes("chat")) {
    return "message";
  }
  if (
    haystack.includes("order") ||
    haystack.includes("ship") ||
    haystack.includes("deliver") ||
    haystack.includes("payment") ||
    haystack.includes("checkout")
  ) {
    return "order";
  }
  if (haystack.includes("account") || haystack.includes("profile") || haystack.includes("verify")) {
    return "account";
  }

  return "general";
}

export function getNotificationTypeLabel(notification = {}) {
  switch (getNotificationTypeKey(notification)) {
    case "message":
      return "New Message";
    case "order":
      return "Order Update";
    case "account":
      return "Account";
    default:
      return "System";
  }
}

export function getNotificationHref(notification = {}, role = 'customer') {
  const link = String(notification.link || "").trim();
  if (link.startsWith("/")) return link;
  if (/^https?:\/\//i.test(link)) return link;

  const isSeller = role === 'seller';

  switch (getNotificationTypeKey(notification)) {
    case "message":
      return isSeller ? "/seller/messages" : "/messages";
    case "order":
      return isSeller ? "/seller/orders" : "/orders";
    case "account":
      return isSeller ? "/seller/profile" : "/profile";
    default:
      return NOTIFICATION_ROUTE;
  }
}

export function formatNotificationTime(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return "Just now";
  if (absSeconds < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 2592000) return formatter.format(Math.round(diffSeconds / 86400), "day");
  if (absSeconds < 31536000) return formatter.format(Math.round(diffSeconds / 2592000), "month");

  return formatter.format(Math.round(diffSeconds / 31536000), "year");
}
