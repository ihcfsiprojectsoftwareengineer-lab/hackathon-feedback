// feedbackController.js
// Usage in your app:
//   const feedback = require('./controllers/feedbackController');
//   app.post('/api/feedback', feedback.submitFeedback);
//
// Adjust the pool import to match your project (mysql2/promise pool).
const pool = require('../config/db');

const HEARD_FROM = [
  'Institution / Faculty', 'Social Media', 'IHCFSI Website', 'Email / WhatsApp',
  'Friend / Peer', 'Orientation / Outreach Session', 'Other'
];
const SUSTAINABILITY = ['Not at all', 'Slightly', 'To some extent', 'Significantly'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const rating = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

function validate(b) {
  const errors = {};
  const d = {
    name: str(b.name),
    institution: str(b.institution),
    team_name: str(b.team_name),
    registered_email: str(b.registered_email).toLowerCase(),
    team_lead_email: str(b.team_lead_email).toLowerCase(),
    heard_from: str(b.heard_from),
    other_source: str(b.other_source),
    faced_issues: str(b.faced_issues),
    issue_description: str(b.issue_description),
    sustainability_thinking: str(b.sustainability_thinking)
  };

  if (!d.name || d.name.length > 150) errors.name = 'Enter your name (max 150 characters).';
  if (!d.institution || d.institution.length > 200) errors.institution = 'Enter your institution (max 200 characters).';
  if (!d.team_name || d.team_name.length > 150) errors.team_name = 'Enter your team name (max 150 characters).';
  if (!EMAIL_RE.test(d.registered_email)) errors.registered_email = 'Enter a valid registered email.';
  if (!EMAIL_RE.test(d.team_lead_email)) errors.team_lead_email = 'Enter a valid team lead email.';

  if (!HEARD_FROM.includes(d.heard_from)) errors.heard_from = 'Choose an option.';
  if (d.heard_from === 'Other') {
    if (!d.other_source) errors.other_source = 'Tell us how you heard about the hackathon.';
    else if (d.other_source.length > 100) errors.other_source = 'Keep this under 100 characters.';
  } else {
    d.other_source = null; // ignore stray text when "Other" isn't selected
  }

  const map = {
    rating_registration: 'rating_registration',
    rating_guidelines: 'rating_guidelines',
    rating_website_ease: 'rating_website_ease',
    rating_communication: 'rating_communication',
    rating_overall: 'rating_overall',
    likelihood_participate: 'likelihood_participate',
    likelihood_recommend: 'likelihood_recommend'
  };
  for (const k of Object.keys(map)) {
    d[k] = rating(b[k]);
    if (d[k] === null) errors[k] = 'Select a rating from 1 to 5.';
  }

  if (!['Yes', 'No'].includes(d.faced_issues)) errors.faced_issues = 'Choose Yes or No.';
  if (d.faced_issues === 'Yes') {
    if (!d.issue_description) errors.issue_description = 'Briefly describe the issue.';
    else if (d.issue_description.length > 250) errors.issue_description = 'Keep this under 250 characters.';
  } else {
    d.issue_description = null;
  }

  if (!SUSTAINABILITY.includes(d.sustainability_thinking)) errors.sustainability_thinking = 'Choose an option.';

  return { errors, d };
}

exports.submitFeedback = async (req, res) => {
  const { errors, d } = validate(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, errors });
  }
  try {
    await pool.execute(
      `INSERT INTO participant_feedback
        (name, institution, team_name, registered_email, team_lead_email,
         heard_from, other_source,
         rating_registration, rating_guidelines, rating_website_ease,
         faced_issues, issue_description,
         rating_communication, rating_overall, sustainability_thinking,
         likelihood_participate, likelihood_recommend)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [d.name, d.institution, d.team_name, d.registered_email, d.team_lead_email,
       d.heard_from, d.other_source,
       d.rating_registration, d.rating_guidelines, d.rating_website_ease,
       d.faced_issues, d.issue_description,
       d.rating_communication, d.rating_overall, d.sustainability_thinking,
       d.likelihood_participate, d.likelihood_recommend]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        errors: { registered_email: 'Feedback has already been submitted for this email.' }
      });
    }
    console.error('submitFeedback error:', err);
    res.status(500).json({ success: false, message: 'Could not save your feedback. Please try again.' });
  }
};
