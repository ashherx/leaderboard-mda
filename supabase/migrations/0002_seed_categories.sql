-- Starting category list from the blueprint. Editable later via admin
-- (Prompt 5) — this seed just gets the fixed launch set into place.
insert into categories (name, slug, description, display_order) values
  ('Web & App Development',   'web-app-development',  'Sites, apps, and platforms built for clients.',        10),
  ('AI & Automation',         'ai-automation',         'AI integrations, agents, and workflow automation.',    20),
  ('Marketing & Growth',      'marketing-growth',      'Paid, organic, and growth marketing agencies.',        30),
  ('Design & Branding',       'design-branding',       'Brand identity, product, and visual design studios.',  40),
  ('Video & Content',         'video-content',         'Video production and content creation shops.',         50),
  ('Copywriting & SEO',       'copywriting-seo',       'Copywriters, content writers, and SEO specialists.',   60),
  ('Consulting & Coaching',   'consulting-coaching',   'Business consultants and coaches.',                    70),
  ('Recruiting & Staffing',   'recruiting-staffing',   'Recruiters and staffing agencies.',                    80),
  ('Bookkeeping & Finance',   'bookkeeping-finance',   'Bookkeepers, accountants, and fractional finance.',    90),
  ('Everything Else',         'everything-else',       'Doesn''t fit a category above? Start here.',          100);
