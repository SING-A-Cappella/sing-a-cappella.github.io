// Website settings — the one file to change when the backend goes live.
window.SING_CONFIG = {
  // Address of the Google Apps Script web app (it ends in /exec). See backend/SETUP.md.
  // While this is empty the site runs in preview mode: forms don't send anything and
  // the calendar, choir directory and shop show clearly-labelled examples.
  backendUrl: "https://script.google.com/macros/s/AKfycbxpvC0zz0kfqn4RJGmuyoxblnGf4L14etv2fD4zg6y_Jr0ZvGaS_lFme8TXKLxfcFAO/exec",

  festival: { name: "SING! Edmonton 2027", start: "2027-03-12", days: 3 },
  contactEmail: "info@singedmonton.com",

  // Mailchimp: Audience → Signup forms → Embedded forms → copy the address in the
  // form's action="…" (it contains list-manage.com/subscribe/post). Empty = preview.
  mailchimpSignupUrl: "https://singedmonton.us12.list-manage.com/subscribe/post?u=1b7845a93211e58fddae18646&id=16a95445e6&f_id=00d60ee9f0",

  // Merch. Each product's buyUrl is its checkout link (for example a Square payment link).
  // Products can also be added on the Shop page itself with "Team: edit this page".
  products: [],

  // Wording changed with "Team: edit this page" → "Copy my changes", pasted here to publish it.
  publishedEdits: {
    // SING! announced this in its own 2026 festival program: Deke Sharon, music director
    // of the Pitch Perfect films, brings a sing-along to Edmonton on Friday 12 March 2027.
    // Remove these two lines if it isn't ready to be on the website yet.
    "event.3c15595a-f75a-80ea-beb7-ebe7e0634e03": "Pitch Perfect Sing-Along with Deke Sharon",
    "fest.lede": "Friday night opens with a Pitch Perfect Sing-Along led by Deke Sharon, music director of the films. The rest of the lineup is on its way — here's the shape of the weekend so you can save the dates now."
  }
};
