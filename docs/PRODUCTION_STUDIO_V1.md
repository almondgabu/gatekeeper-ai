# Production Studio V1

## Purpose

Production Studio is the next upgrade of Content Studio. Its job is to help Almond create complete visual production packages for posts, reels, and videos, not just copy blocks.

V1 should stay grounded in the existing Content Studio flow:

- Keep the current opportunity-to-studio handoff model based on query params.
- Keep the current local save history unless extending it is trivial.
- Keep copy-ready outputs as the primary deliverable.
- Do not depend on direct publishing, direct image generation, direct Google Flow API access, or asset persistence.

The product shift is from "content package generator" to "production planning studio" while preserving the current safe, structured, copy-first workflow.

## Current Baseline

The current implementation already provides these foundations:

- A `create-content` mode with structured output sections.
- An `inspiration` mode for idea generation only.
- A `saved` mode backed by browser localStorage.
- Opportunity handoff from the opportunity detail page into Content Studio via query params.
- A visible "Loaded from opportunity" note when prefill data is present.
- A section-based output renderer with one full-package copy action.
- A local save model for generated packages and idea cards.

V1 should evolve this existing system rather than replace it with an unrelated tool.

## Product Definition

Production Studio helps Almond:

- turn an idea, listing, opportunity, or marketing angle into a production-ready output
- plan both copy and visuals in one pass
- create storyboard-ready prompts for short-form video
- keep prompts copy-ready for ChatGPT image generation, Google Flow, or manual production workflows

## Output Modes

Production Studio V1 should support three output modes:

1. Normal Post
2. Reel / Video
3. Production Package

Recommended mapping:

- `Normal Post` is the upgraded replacement for simple post packages.
- `Reel / Video` is for short-form motion planning and scene breakdown.
- `Production Package` is the most complete mode and should combine strategy, story structure, and production-ready prompts.

The existing `inspiration` and `saved` modes should remain in the overall product for V1, but this spec focuses on the upgraded create flow.

## Normal Post Requirements

Every Normal Post output must include:

- caption or post copy
- visual direction
- image prompt
- optional video prompt
- hashtags and CTA where relevant

Recommended structure for Normal Post:

1. Title
2. Strategy Summary
3. Caption / Post Copy
4. Visual Direction
5. Image Prompt
6. Optional Video Prompt
7. CTA
8. Hashtags

Notes:

- `Visual Direction` should describe framing, mood, subject emphasis, and composition.
- `Image Prompt` should be ready to copy into an external image model.
- `Optional Video Prompt` should appear only when the requested output would plausibly benefit from motion treatment.
- `CTA` and `Hashtags` should remain concise and safe under the current brand rules.

## Reel / Video Requirements

### Short Videos: 8 Seconds or Less

If requested duration is less than or equal to 8 seconds, the output should contain:

- one image prompt
- one video prompt

Recommended structure:

1. Title
2. Story Goal
3. Visual Direction
4. Image Prompt
5. Video Prompt
6. CTA or End Beat when relevant

### Longer Videos: More Than 8 Seconds

If requested duration is greater than 8 seconds, the system should automatically split the concept into scenes.

Scene count rule:

`scenes = ceiling(duration / 8)`

Each scene must include:

- scene number
- timestamp
- purpose
- camera direction
- continuity note
- transition
- image prompt
- video prompt
- copy image prompt button
- copy video prompt button
- copy entire scene button

Recommended scene schema:

1. Scene Number
2. Timestamp
3. Purpose
4. Camera Direction
5. Continuity Note
6. Transition
7. Image Prompt
8. Video Prompt

Recommended scene timestamp format:

- `Scene 1: 0:00-0:08`
- `Scene 2: 0:08-0:16`

Recommended behavior for the final scene:

- The final scene may be shorter than 8 seconds if the total duration is not divisible by 8.
- The prompt should still include the exact scene duration.

## Production Package Requirements

Production Package is the richest output mode. It should combine strategy, narrative planning, and production prompts in one response.

Required sections:

1. Package Title
2. Content Objective
3. Audience and Platform Fit
4. Story Style Selection
5. Hook / Opening Angle
6. Caption / Post Copy
7. Visual Direction
8. Storyboard / Scene Breakdown
9. Production Checklist
10. CTA
11. Hashtags when relevant

Production Package should be the preferred mode when:

- the user wants a reel or video with multiple scenes
- the user wants a full handoff for creative execution
- the user starts from an opportunity and needs a complete production plan

## Google Flow Rules

All video-oriented outputs must follow these rules:

- maximum 8 seconds per scene
- no text overlay unless the user explicitly requests it
- continuity must be maintained across scenes
- prompts should optimize for vertical reels where relevant
- every video prompt must include duration

Interpretation rules:

- `no text overlay` means prompts should not instruct on-screen typography, subtitles, captions, banners, or lower-thirds unless requested.
- `maintain continuity` means subject identity, wardrobe, environment, lighting logic, camera energy, and narrative progression should stay consistent from scene to scene.
- `optimize for vertical reels` means portrait framing, close visual subject focus, and movement suitable for short-form social viewing.

Recommended video prompt format guidance:

- include duration in seconds
- include shot framing
- include subject action
- include camera movement
- include environment cues
- include tone or pacing cues
- avoid generic filler wording

## Story Style Settings

V1 should include these story style settings:

- Documentary with Narration
- Dialogue / Conversation
- Host on Camera
- Cinematic Visual Story
- Educational
- Investor Pitch
- Property Tour
- Comedy / Skit

The UI should explain that story style changes four things:

- story arc
- narration or dialogue approach
- camera direction
- prompt wording

### Documentary with Narration

- Story arc: observation, explanation, insight, takeaway
- Narration/dialogue: guided voiceover dominates
- Camera direction: grounded, observational, purposeful cutaways
- Prompt wording: factual, cinematic, controlled, documentary-style

### Dialogue / Conversation

- Story arc: question, exchange, clarification, takeaway
- Narration/dialogue: spoken back-and-forth leads the pacing
- Camera direction: over-shoulder, medium shots, reaction framing
- Prompt wording: conversational, responsive, performance-aware

### Host on Camera

- Story arc: host hook, host explanation, host payoff, CTA
- Narration/dialogue: direct-to-camera delivery
- Camera direction: presenter-led framing, confident eye-line, simple emphasis moves
- Prompt wording: host-centered, clear delivery, audience-facing

### Cinematic Visual Story

- Story arc: mood, reveal, emotional build, visual payoff
- Narration/dialogue: minimal or optional
- Camera direction: stylized composition, motion, lighting, transitions
- Prompt wording: cinematic, atmospheric, visual-first

### Educational

- Story arc: problem, explanation, example, takeaway
- Narration/dialogue: clear structured teaching voice
- Camera direction: instructional framing, clarity over flourish
- Prompt wording: explanatory, precise, trust-building

### Investor Pitch

- Story arc: opportunity, value, credibility, next step
- Narration/dialogue: persuasive but controlled
- Camera direction: polished, premium, confidence-oriented
- Prompt wording: business-minded, concise, value-led

### Property Tour

- Story arc: arrival, feature sequence, spatial understanding, close
- Narration/dialogue: optional voiceover or host guidance
- Camera direction: walkthrough motion, spatial continuity, feature emphasis
- Prompt wording: location-aware, movement-aware, descriptive

### Comedy / Skit

- Story arc: setup, turn, punchline, callback or CTA
- Narration/dialogue: timing-sensitive performance beats
- Camera direction: reaction shots, timing cuts, comedic emphasis
- Prompt wording: playful, punchy, performance-driven without becoming chaotic

## Thumbnail Rule

Each scene row should use only one thumbnail.

Rules:

- one thumbnail per scene in the storyboard row
- do not repeat a second thumbnail inside the image prompt box
- the thumbnail area is for fast visual scanning, not duplicated prompt rendering

This keeps the storyboard readable and prevents visual clutter.

## Image Generation and Upload Plan

V1 design only:

- image generation is a future enhancement
- image upload or reference image support is a future enhancement
- V1 must not be blocked by lack of an image generation API
- prompts must still be copy-ready for ChatGPT image generation or Google Flow workflows

Implications:

- the primary deliverable remains structured text prompts
- the UI can reserve space for future image generation or image reference support, but should not expose dead controls in V1
- all prompts should be usable immediately through external tools or manual creative execution

## UI Layout

V1 should define five core interface zones inside the create flow.

### 1. Strategy Panel

Purpose:

- collect the user input and generation settings

Recommended inputs:

- output mode
- content type
- platform
- aspect ratio
- duration when video mode is selected
- story style
- tone
- language
- goal
- topic or brief

When loaded from an opportunity:

- preserve the existing loaded-from-opportunity note
- keep prefilled topic, content type, goal, and tone behavior

### 2. AI Planning Section

Purpose:

- show the strategic interpretation before the storyboard

Recommended content:

- content objective
- intended audience angle
- platform fit
- recommended story approach
- visual direction summary

This section should help Almond quickly assess whether the AI understood the brief before using scene prompts.

### 3. Storyboard Section

Purpose:

- provide the main scene-by-scene production view

Recommended layout:

- one row or card per scene
- single scene thumbnail region
- scene metadata block
- image prompt block
- video prompt block
- copy actions per prompt and per scene

For short videos under or equal to 8 seconds:

- a simplified single-scene storyboard is acceptable

### 4. Scene Breakdown

Purpose:

- present the detailed fields needed for production

Each scene should show:

- scene number
- timestamp
- purpose
- camera direction
- continuity note
- transition
- image prompt
- video prompt

### 5. Production Checklist

Purpose:

- provide a practical execution summary at the bottom of the package

Recommended items:

- confirm aspect ratio
- confirm scene count
- confirm continuity across scenes
- confirm whether voiceover or dialogue is required
- confirm whether captions or text overlays were requested
- confirm copy-ready prompts are present

### Copy Buttons

V1 should support these copy actions:

- copy full package
- copy image prompt per scene
- copy video prompt per scene
- copy entire scene

This expands the current single full-package copy behavior into prompt-level production actions.

### Loaded-from-Opportunity Note

If the user entered from an opportunity, preserve a visible context note.

The note should continue to communicate:

- that the package was loaded from an opportunity
- which opportunity title provided the source context

This helps maintain context continuity across the Opportunity to Production Studio flow.

## Existing Copy, Save, and History Behavior

The current system already supports:

- copy full generated package
- save content packages locally in browser storage
- save idea cards locally in browser storage
- reload saved packages or ideas back into the UI
- delete saved local history items

V1 should preserve this behavior.

## Save Behavior

For V1:

- keep existing local save history unless extending it is simple
- allow production package outputs to continue using browser-local history first
- if simple, extend saved package shape to support storyboard-oriented production outputs without creating a database table

Future direction:

- save production packages as activities or assets linked to opportunity or project

But not in V1:

- no asset table yet
- no server-side saved package store yet

## API and Output Structure Direction

The current API returns a single JSON object with top-level metadata and a `sections` array for create-content mode. V1 should preserve the structured JSON discipline but evolve the output schema to support storyboard scenes.

Recommended V1 response model:

- common package metadata at the top level
- planning summary fields
- `sections` for top-level narrative blocks when useful
- `scenes` array for storyboard-capable outputs

Recommended top-level fields:

- `title`
- `outputMode`
- `contentType`
- `platform`
- `aspectRatio`
- `storyStyle`
- `duration`
- `planning`
- `sections`
- `scenes`
- `checklist`

Recommended `planning` shape:

- `objective`
- `audienceAngle`
- `platformFit`
- `storyApproach`
- `visualDirection`

Recommended `scenes` shape:

- `sceneNumber`
- `timestamp`
- `purpose`
- `cameraDirection`
- `continuityNote`
- `transition`
- `thumbnailPrompt` or `thumbnailDirection`
- `imagePrompt`
- `videoPrompt`

Notes:

- `thumbnailPrompt` is optional in the data model, but if present it still maps to one thumbnail area only.
- `Normal Post` may return zero scenes.
- `Reel / Video` and `Production Package` may return one or more scenes.

## Non-Goals for V1

V1 explicitly does not include:

- publishing automation
- WhatsApp integration
- direct Google Flow API integration
- image generation API integration
- asset table creation
- performance tracking

Also avoid these scope expansions:

- project-wide asset management
- automated activity logging for generated packages in this milestone
- review workflows or approval pipelines
- multi-user collaboration features

## Implementation Phases

### Phase 1: Output Structure and Prompt Formatting

Focus:

- add Production Studio output modes
- add duration-aware logic
- add scene splitting logic
- add story style-aware prompt construction
- add storyboard-capable response schema
- preserve existing safety rules

Primary outcome:

- the API can return production-ready structures even before the UI fully evolves

### Phase 2: UI Storyboard Layout

Focus:

- replace the current simple section renderer for applicable modes
- add strategy panel and planning summary
- add storyboard rows and scene cards
- keep loaded-from-opportunity context visible

Primary outcome:

- the UI can display scene-based production plans clearly

### Phase 3: Copy Buttons and Local Save

Focus:

- add per-scene copy actions
- add image prompt copy
- add video prompt copy
- add copy entire scene
- extend local save shape only if needed for storyboard outputs

Primary outcome:

- the generated production package becomes practical for immediate use

### Phase 4: Activity and Asset Integration Later

Focus:

- future linking of saved production packages to activities or assets
- future persistence beyond local browser history

Primary outcome:

- a path exists for later business integration without blocking V1

## Recommended V1 Constraints

To keep this milestone narrow:

- do not rename the route yet unless the product rename is intentional everywhere
- do not remove existing inspiration mode
- do not replace local save with database persistence yet
- do not add API dependencies outside the current OpenAI-based generation path for this milestone
- do not combine this milestone with activity or asset persistence

## Acceptance Criteria for Future Implementation

The implementation should be considered correct when:

1. Normal Post always includes copy, visual direction, image prompt, and CTA/hashtags where appropriate.
2. Reel / Video outputs generate one scene for durations up to 8 seconds.
3. Reel / Video outputs generate `ceiling(duration / 8)` scenes for durations above 8 seconds.
4. Every scene includes purpose, camera direction, continuity note, transition, image prompt, and video prompt.
5. Every video prompt includes duration.
6. No text overlay is included unless explicitly requested.
7. Story style clearly affects structure and prompt language.
8. The UI supports per-scene copy actions.
9. Existing local save behavior remains available in V1.
10. Opportunity-prefilled context remains visible and intact.