E.M. MADHAN — GRAPHIC DESIGNER PORTFOLIO
==========================================

HOW TO RUN
-----------
No installation or server needed. Just double-click index.html
(or right-click > Open with > your browser). Everything works
locally, offline, from these files alone (fonts load from Google
Fonts online — the site still works without internet, it will
just fall back to your system font).


FOLDER STRUCTURE
-----------------
madhan-portfolio/
├── index.html            <- the public site (one page)
├── admin.html            <- admin panel: add/edit/delete work & videos
├── css/
│   ├── style.css         <- shared styling, themes, responsive rules, animations
│   └── admin.css         <- admin panel–only styling
├── js/
│   ├── data.js           <- default content + storage + theme-toggle logic (shared)
│   ├── script.js         <- public site interactivity
│   └── admin.js          <- admin panel logic
├── assets/
│   ├── images/           <- put profile + project photos here
│   ├── videos/           <- put edited video files (.mp4) here
│   └── resume/           <- put your resume PDF here
└── README.txt            <- this file


LIGHT / DARK THEME
--------------------
This site is dark-themed only — there's no light mode or toggle
to worry about. Colors live at the top of css/style.css inside
:root{...} if you want to adjust them.


ADMIN PANEL — ADDING POSTERS & VIDEOS WITHOUT EDITING CODE
--------------------------------------------------------------
Open admin.html (there's also a small "Admin" link in the site
footer). Enter the passcode:

    madhan2026

You can change this passcode by opening js/admin.js and editing
the ADMIN_PASSCODE line near the top.

From the admin panel you can:
  - Add / edit / delete poster, social, branding, logo and
    creative work — upload an image directly (it's resized
    automatically) or type an image path.
  - Add / edit / delete videos — click "Choose a video file, or
    drag one here" to upload the actual .mp4 directly (no need to
    manually place it in assets/videos/ anymore). Or, if you'd
    rather keep videos as files in the project folder, paste a
    path (e.g. assets/videos/video-05.mp4) into the field below
    the upload box instead — either way works. Add an optional
    thumbnail image and duration label too.
  - Export your data as a .json backup, and Import it back in —
    do this whenever you've added real work.
  - Reset everything back to the original placeholder content.

IMPORTANT — HOW STORAGE WORKS HERE:
This is a no-backend, static site (as the original brief asked
for), so there's no shared database. Everything you add in the
admin panel is saved in that one browser, using two different
storage areas:
  - Titles, descriptions, image thumbnails and video paths are
    saved in localStorage (small, text-only, a few MB limit).
  - Uploaded video FILES are saved separately in IndexedDB, which
    gives browsers much more room (commonly hundreds of MB, though
    the exact limit depends on the device). This is what makes the
    "Choose a video file" upload actually work.
  This means:
  - Changes you make on your laptop in Chrome won't appear on
    your phone, or in a different browser, until you Export the
    data and Import it there too.
  - Export/Import only carries the text data (titles, paths,
    thumbnails) — it does NOT include the bytes of an uploaded
    video file, since those live in that one browser's IndexedDB.
    Keep your original .mp4 files somewhere safe as a real backup;
    don't rely on Export alone for uploaded videos.
  - Clearing your browser's site data/history can erase everything,
    including uploaded videos — so keep real backups of your video
    files regardless of this admin panel.
  - The passcode gate is a convenience, not real security —
    anyone who views the page source could read it. Don't rely on
    it to protect anything sensitive.
  - If you eventually want everyone who visits the live site to
    see the same admin-added content (a real shared "database"),
    that requires an actual backend — outside the scope of this
    no-backend, open-index.html project.


HOW TO ADD YOUR REAL CONTENT
------------------------------

1) PROFILE PHOTO
   Save a photo as:  assets/images/profile.jpg
   If it's missing, the hero shows an "EM" monogram instead —
   nothing breaks.

2) PORTFOLIO PROJECTS (posters, social, branding, logo, creative)
   The easiest way is the admin panel (see above). If you'd rather
   edit code directly, open js/data.js and find `defaultProjects`
   near the top. Each project looks like this:

     { title: "Project Title", category: "posters",
       image: "assets/images/project-01.jpg",
       description: "A short description." }

   - `category` must be one of: posters, social, branding, logo, creative
     (these match the filter tabs on the Work section)
   - Add or remove objects from the list freely — the grid and the
     filter tabs update automatically.
   - Drop the matching image file into assets/images/. Missing images
     show a clean "Image coming soon" placeholder instead of breaking.
   - Note: this list is only used until the admin panel saves real
     content in the browser — once you've added anything through
     admin.html, that browser shows your saved items instead.

3) VIDEOS
   Easiest via the admin panel and its "Choose a video file" upload
   (see above). To edit code directly instead, open js/data.js and
   find `defaultVideos` near the top. Each video looks like this:

     { title: "Video Project 01", category: "Video Editing",
       video: "assets/videos/video-01.mp4",
       poster: "assets/images/video-01.jpg",
       duration: "00:30" }

   - `poster` is optional (thumbnail shown before playing).
   - Add real .mp4 files to assets/videos/ and reference them here,
     the same way projects reference images above.

4) RESUME PDF
   Save your resume as: assets/resume/madhan-resume.pdf
   (Both "Download Resume" buttons already point to this path.)

5) SOCIAL LINKS
   In index.html, search for "Social links" inside the Contact
   section. Three placeholder icons are there but disabled
   (greyed out, not clickable) because no accounts were supplied.
   To activate one: replace its href="#" with your real profile
   URL, then delete the aria-disabled="true" attribute, the
   tabindex="-1" attribute, and the "is-disabled" class.


CUSTOMIZING COLORS / FONTS
-----------------------------
All core colors live at the top of css/style.css inside :root{...}:

  --bg           background
  --surface      slightly lighter panel background
  --card         card background
  --primary      electric purple accent
  --accent       neon orange accent
  --text         main text color
  --muted        secondary/gray text

Change a value there and it updates everywhere on the site.


NOTES
-----
- Nothing on this site was invented beyond what was provided:
  the About text, Experience (Industrial Training, Amirta
  International Institute of Hotel Management, Trichy,
  March–August 2021), Education (B.Sc Hotel Management,
  2019–2022), Skills (Photoshop, Illustrator, Graphic Design),
  and contact details (madhan50@gmail.com, 73976 29889) all
  come directly from the information supplied for this project.
- Portfolio projects and videos are placeholders by design —
  replace them with real work using the steps above.
- The site respects "reduce motion" accessibility settings and
  works without JavaScript-breaking errors if an image or video
  file is missing.
