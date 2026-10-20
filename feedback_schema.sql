-- Participant feedback: Sustainability Hackathon 2026, Round 1 screening
-- MariaDB 10.2+ (CHECK constraints are enforced from 10.2.1)

CREATE TABLE IF NOT EXISTS participant_feedback (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  -- Participant details
  name                     VARCHAR(150) NOT NULL,
  institution              VARCHAR(200) NOT NULL,
  team_name                VARCHAR(150) NOT NULL,
  registered_email         VARCHAR(255) NOT NULL,
  team_lead_email          VARCHAR(255) NOT NULL,

  -- Q6: dropdown value + free text when "Other"
  heard_from               ENUM('Institution / Faculty','Social Media','IHCFSI Website',
                                'Email / WhatsApp','Friend / Peer',
                                'Orientation / Outreach Session','Other') NOT NULL,
  other_source             VARCHAR(100) NULL,

  -- Registration, submission and website experience
  rating_registration      TINYINT UNSIGNED NOT NULL,   -- Q7
  rating_guidelines        TINYINT UNSIGNED NOT NULL,   -- Q8
  rating_website_ease      TINYINT UNSIGNED NOT NULL,   -- Q9
  faced_issues             ENUM('Yes','No') NOT NULL,   -- Q10
  issue_description        VARCHAR(250) NULL,

  -- Communication and process
  rating_communication     TINYINT UNSIGNED NOT NULL,   -- Q11

  -- Overall experience
  rating_overall           TINYINT UNSIGNED NOT NULL,   -- Q12
  sustainability_thinking  ENUM('Not at all','Slightly','To some extent','Significantly') NOT NULL, -- Q13
  likelihood_participate   TINYINT UNSIGNED NOT NULL,   -- Q14
  likelihood_recommend     TINYINT UNSIGNED NOT NULL,   -- Q15

  created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- stored in UTC (server is UTC)

  -- One response per registered email
  UNIQUE KEY uq_feedback_registered_email (registered_email),

  -- "Other" selected  => other_source must be non-empty
  -- "Other" not selected => other_source must be NULL
  CONSTRAINT chk_other_source CHECK (
    (heard_from = 'Other' AND other_source IS NOT NULL AND CHAR_LENGTH(TRIM(other_source)) BETWEEN 1 AND 100)
    OR (heard_from <> 'Other' AND other_source IS NULL)
  ),

  -- Issue text only when faced_issues = 'Yes'
  CONSTRAINT chk_issue_description CHECK (
    (faced_issues = 'Yes' AND issue_description IS NOT NULL AND CHAR_LENGTH(TRIM(issue_description)) BETWEEN 1 AND 250)
    OR (faced_issues = 'No' AND issue_description IS NULL)
  ),

  CONSTRAINT chk_r1 CHECK (rating_registration  BETWEEN 1 AND 5),
  CONSTRAINT chk_r2 CHECK (rating_guidelines    BETWEEN 1 AND 5),
  CONSTRAINT chk_r3 CHECK (rating_website_ease  BETWEEN 1 AND 5),
  CONSTRAINT chk_r4 CHECK (rating_communication BETWEEN 1 AND 5),
  CONSTRAINT chk_r5 CHECK (rating_overall       BETWEEN 1 AND 5),
  CONSTRAINT chk_r6 CHECK (likelihood_participate BETWEEN 1 AND 5),
  CONSTRAINT chk_r7 CHECK (likelihood_recommend   BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
