# Tala lär sig svenska

A Swedish course for Tala, taught in Arabic. It is a web app (PWA) for her phone, with a progress page for Eslam.

- `index.html` is Tala's app: lessons, flashcards, games and unit tests.
- `eslam.html` is Eslam's progress page.
- `js/content.js` holds the course. Add new units there.
- `supabase/schema.sql` sets up the database. Run it once in the Supabase SQL editor.

## Setup

1. Supabase: run `supabase/schema.sql`. Create one user for Tala and one for Eslam (Authentication → Users → Add user, with Auto Confirm). Then run the `insert into public.viewers` line at the bottom of the file, with your e-mail addresses filled in.
2. `js/config.js` holds the project URL and the publishable key. The key is public by design. Row level security keeps the data private.
3. GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

Tala opens the site in Chrome on her phone, signs in once, and adds it to the home screen with ⋮ → "Add to Home screen". On the phone, Swedish speech needs the Swedish voice for Google text-to-speech. The app shows how to install it.

Local preview with no sync: serve the folder (for example `python3 -m http.server`) with empty values in `config.js`. Then `eslam.html?local` shows the progress page for the data in that browser.
