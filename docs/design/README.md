# Login design examples — 13 September 2026

Open `login-examples.html` in a browser to compare three directions. It is self-contained, with the existing local Poppins fonts embedded, and works without a server. The Desktop/Phone controls resize the example canvas. The working-app link expects the isolated preview at `http://localhost:3008`.

- **Signature:** black, ivory and warm gold, editorial serif headline, a layered illustration of the client workspace. Implemented in the actual shared auth layout and login form.
- **Clarity:** ivory and sage, form on the left, light brand panel and simpler typography. Visual alternative only.
- **Midnight:** a centred form on an ink-blue background with lilac accents. Visual alternative only.

Examples use static sample fields and collect no credentials. They are design artifacts, not production routes. The real login retains existing server actions, validation, requested-page redirects, approval gates and password-recovery links. The illustrated documents are decorative and hidden from assistive technology.

Verification: four existing desktop/mobile sign-in cases passed, covering errors, password visibility, correction/retry, field focus, redirects, sign-out, recovery and registration navigation. Five existing responsive cases passed across small Android, iPhone, iPad portrait, iPad landscape and desktop, including login visibility, settings and mobile navigation. These are Chromium emulations. Two sign-in cases were rerun after shortening the decorative headline to capture the final design. Lint and both preview/production builds passed; the final headline was also compiled in the preview build. Light desktop, phone and dark login views were visually inspected, along with all three comparison designs.

This follow-up is saved locally. The hosted review deployment remains the previous adviser UI candidate `e829b02`; neither it nor the primary public site has been updated with this design pass.
