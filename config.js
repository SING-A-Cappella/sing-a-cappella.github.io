// Website settings — the one file to change when the backend goes live.
window.SING_CONFIG = {
  // Address of the Google Apps Script web app (it ends in /exec). See backend/SETUP.md.
  // While this is empty the site runs in preview mode: forms don't send anything and
  // the calendar, choir directory and shop show clearly-labelled examples.
  backendUrl: "",

  festival: { name: "SING! Edmonton 2027", start: "2027-03-12", days: 3 },
  contactEmail: "info@singedmonton.com",

  // Mailchimp: Audience → Signup forms → Embedded forms → copy the address in the
  // form's action="…" (it contains list-manage.com/subscribe/post). Empty = preview.
  mailchimpSignupUrl: "",

  // Merch. Each product's buyUrl is its checkout link (for example a Square payment link).
  // Products can also be added on the Shop page itself with "Team: edit this page".
  products: [],

  // Wording changed with "Team: edit this page" → "Copy my changes", pasted here to publish it.
  publishedEdits: {}
};
