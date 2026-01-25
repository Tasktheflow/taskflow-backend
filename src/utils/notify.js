const Notification = require("../models/notification.model");

const notify = async ({
  user,
  type,
  message,
  project = null,
  task = null,
}) => {
  await Notification.create({
    user,
    type,
    message,
    project,
    task,
  });
};

module.exports = notify;
