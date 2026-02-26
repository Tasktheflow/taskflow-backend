const inviteTemplate = (projectTitle, inviteLink) => {
  return `
    <div style="font-family:Arial;padding:20px;max-width:500px;margin:auto;">
      <h2 style="color:#4f46e5;">Project Invitation</h2>
      <p>You have been invited to join <b>${projectTitle}</b>.</p>
      <p>This invitation expires in 24 hours.</p>
      <a href="${inviteLink}" 
         style="display:inline-block;margin-top:15px;padding:10px 15px;
         background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">
         Accept Invitation
      </a>
    </div>
  `;
};
module.exports = { inviteTemplate };