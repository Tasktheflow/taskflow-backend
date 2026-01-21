const Notification = require("../models/notification.model");

const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
};

module.exports = { getMyNotifications };
