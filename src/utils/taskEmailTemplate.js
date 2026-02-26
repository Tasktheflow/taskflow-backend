const taskAssignedTemplate = (username, taskTitle) => `
  <div style="font-family:Arial;padding:20px;">
    <h2>New Task Assigned</h2>
    <p>Hello ${username},</p>
    <p>You were assigned to <b>${taskTitle}</b>.</p>
  </div>
`;

module.exports = { taskAssignedTemplate };