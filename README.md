# Portfolio Website Built on React

Personal website built on React.

## Local development

Use Node.js 22, then install the locked dependencies and start the development server:

```sh
npm ci
npm run dev
```

## Production build and preview

```sh
npm run build
npm start
```

`npm start` serves only the optimized files in `build/`, with a single-page-app fallback. It binds to `0.0.0.0` and uses Cloud Run's `PORT`, or port 8080 for a local preview. It does not start the React development server. Rebuild after source changes before previewing them.

## Deployment

The Google Cloud Build trigger in project `apctg-cloud` watches the `prod` branch. It runs `npm ci` and `npm run build` with Node.js 22, then deploys the source to Cloud Run service `alexpcastro-prod` in `us-east1`. The source build uses Google Buildpacks, which runs the build script and uses `npm start` as the runtime entrypoint.

Pushing to `prod` deploys to **https://alexpcastro.com**. Keep proposed changes off that branch until the deployment is approved.

## One-page portfolio

The portfolio is a continuous page: introduction, an interactive six-chapter experience gallery, a full-width skills field, education, and contact. The résumé-download area is deliberately blank, and no résumé PDF is included in the public assets. It has no startup gate or desktop/window navigation. Existing section links remain supported, including legacy `#projects` to experience and `#about` to contact. `#skills` now links directly to the skills section. Direct links and browser Back/Forward restore section focus without hiding other content.

### Original career artwork

The introduction is centered text only. Six distinct original AI-generated stills accompany the experience entries, with a matching inky-violet, warm-ivory and coral palette. The visuals are imagined illustrations, not photographs or evidence of employer or university properties. The series depicts an AI finance engine, a fictional international research presentation, a web-search research machine, a miniature New York property block, a garage startup and an original voxel gaming world inside hosting hardware. The assembly scene does not depict or identify Alex, Sophie Mitra or a real presenter.

The code-based color pass uses edge-preserving smoothing, mean-shift texture reduction, soft posterization and warm/cool palette mapping to create cobalt/violet shadows and exaggerated pink, orange and yellow light. This reduces texture without changing the scene or inventing new objects. Full-resolution originals remain in the ignored review-input directory; `scripts/style_career_artwork.py` reproduces the processed assets using locally installed OpenCV, NumPy and Pillow. The treatment is baked into the files, with no runtime filters or canvas processing.

The image component serves local 640px and 1280px JPEG variants through `srcset` and `sizes`, reserves the image dimensions, decodes asynchronously and loads only the first image eagerly at startup. Other entries use native lazy loading and switch to eager loading when selected. Images retain their complete composition without cropping. Each scene has a distinct smooth curved silhouette behind it, tapering continuously into small rounded accents with softly muted color. A matching one-pixel outline keeps the thinnest edges visible at every responsive size without changing the image dimensions. The artwork has gently rounded corners, while the six decorative SVG silhouettes scale with the image on phones. Frames are hidden from assistive technology and add no animation, filters or extra image downloads. Wide screens show a horizontal row of image spines. A deliberate mouse hover expands one framed image and its story, pushing the other chapters aside and fading them. The image panels themselves are accessible native buttons, selected by click/tap or Left/Right, Home and End keys. No visible chips, heading or instruction copy sits above the gallery. Only the selected story is exposed to assistive technology; focused links and keyboard reading are protected from incidental hover. On phones, all six framed image panels stack vertically. Tapping a panel expands its full image and story in place; other images remain visible as shallow horizontal previews with company labels. Native buttons expose expanded/collapsed state, and Up/Down, Home and End move between image controls. No duplicate thumbnail downloads are required. Desktop inner content keeps a fixed final width while the surrounding card expands, avoiding transient text wrapping and row-height jumps. Reduced-motion users get immediate state changes without layout animation. Print CSS includes all six stories. There are no remote image requests or added dependencies.

### Floating skills

The section beneath the experience gallery reuses all 53 existing résumé-aligned skills from `src/data/skills.js`, also shared by the retained Skills page. Four mixed, staggered layers move continuously left to right with different speeds, slight rotation, gentle vertical drift, and faded viewport edges. Each track contains two identical groups so the loop has no visible restart. The section spans the page width without adding horizontal scrolling.

A keyboard-accessible Pause/Resume control freezes both horizontal and vertical motion. View all skills switches to a complete, categorized static list and preserves a deliberate pause on return. Reduced-motion and data-saving visitors get that readable list automatically; printing includes every skill once. The animated copies are decorative and hidden from assistive technology, which receives one complete list. Motion pauses offscreen and in background tabs. No animation library, remote assets, or new dependencies are required.

### Experience video status

The six requested generated 15-second videos are **not yet available**. Generation is blocked on connecting an image-to-video provider. No CSS animation, pan/zoom export, placeholder media or unrelated footage is substituted. Until actual clips are added, the gallery remains the same still-image gallery and shows no video controls.

Playback support is prepared in `CareerVideo`, with the asset map deliberately empty in `src/data/careerVideos.js`. Add a source only after the file exists and has been checked. Each clip must start with the matching treated `public/artwork/<kind>-neon-1280.jpg`, preserve the full composition and colors, last 15 seconds, have no audio, and be encoded for browser playback with a small fast-start MP4. Verify the first frame and loop seam visually before enabling it.

When sources are available, only the selected chapter mounts media. The video is muted, inline and looping on desktop and touch devices. Loading waits until the image is on screen and the tab is visible; inactive, offscreen and background-tab clips are removed and paused. The original responsive image remains visible until playback begins and is retained on media/autoplay failure. A separate keyboard-accessible pause/resume control in the story stops motion across chapter changes, without nesting controls in the image button. Reduced-motion and data-saving visitors receive stills with no video request or pause control. Printing also shows stills. This support has unit coverage with mocked media behavior; real clip decoding and seamless loops cannot be validated until generated assets exist.

The Deloitte wordmark retains its locally hosted Open Sans ExtraBold subset and green dot. Its existing brief color pass is bypassed for reduced-motion users. Previous desktop components and the earlier vector experiment are retained but are no longer mounted by the one-page app.

Run the regression suite with `CI=true npm test -- --watchAll=false --runInBand`. It covers the current content, navigation/focus, gallery selection and keyboard navigation, deliberate/cancelled/touch hover, protected reading focus, absence of a public résumé download, centered text-only introduction and responsive local image configuration, plus retained component behavior. Preview the production build on loopback with `npx serve --single --no-clipboard --listen tcp://127.0.0.1:4175 build`. Publishing the approved design uses the `prod` deployment workflow above.

Campus photography and technology marks retained for the earlier pages have attribution in `public/education/ATTRIBUTION.txt` and `public/skill-icons/ATTRIBUTION.txt`.

## Career content

Experience, About, and Skills are aligned with Alex's current Job Search official resume, revision 38 (November 10, 2026), with later portfolio-specific date and company-scale corrections retained. APC remains first, August 2009–April 2015. The timeline includes the two paid research appointments. BROKR's approximately $2M monthly lead volume is an estimate of leads, not booked revenue or commissions. The public-facing draft omits private engagement values and identifying client details; nothing in the draft establishes employer disclosure approval.

`CompanyScale` is the reusable, static people infographic for joining position and later organization size. Pure Digital shows Alex as the fourth person and a later company of 16, BROKR as the third and 21, and AI Advantage as around 12 people when joining and 100+ later. The last is organization size, separate from the 15-engineer core team. SVG people are one-to-one, with a starred outline identifying Alex beyond color, a visible legend, and one accessible text equivalent. Narrow containers stack the stages; no motion, tracking, or additional dependency is required.
