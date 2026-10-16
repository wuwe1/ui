# Motion

A vocabulary: each motion has a name and one meaning. A component picks from here; a motion that isn't here gets a name and a row before it ships, so a prompt can say 「移除用 darken-then-fold」 and mean exactly this.

Timing, from `principles.md`: 150ms small, 200ms default, 300ms drawers; enter with `ease-out-strong`, exit with `ease-in-strong`, follow a finger with `ease-drawer`.

## Moments

Motion answers a question a person has the moment something changes. Before picking motions, list the moments – `.claude/skills/component/SKILL.md`, step 2:

| Question | Answered by |
|---|---|
| Where did my choice go? | glide |
| What just arrived? | grow, pop, rise |
| Which one is leaving? | darken-then-fold |
| Did it count up or down? | roll |
| Is something still working? | shimmer |
| What just happened? | receipt |
| What will happen if I do this? | preview, arm |
| Is it ready to take this? | fan |
| Where did it go – taken, or put back? | lift, sink |
| Where did my message land? | slot-in |
| Is it live right now? | pulse |
| Is it done with? | fold |

## The vocabulary

| Name | Means | How | Reduced motion | In |
|---|---|---|---|---|
| glide | The selection moved – here | An `accent` pill translates to the new row or option, 200ms `ease-out-strong`; the edge facing the move may lead | The pill fades in at its new place, 150ms | `SegmentedControl`, `Command`, `Combobox` |
| grow | Something was added here | Its width or height opens from 0 – grid `0fr` → `1fr` – 200ms | It fades in, space at once | `Combobox` chips |
| pop | This now exists, or got picked | Scale 0.8 → 1.04 → 1 over 200ms for a chip; 0.5 → 1 over 150ms for a ✓ | Fade | `Combobox` chips and ✓ |
| darken-then-fold | This one is leaving – this one | It darkens for 150ms (`accent`, a stronger ring), then folds and fades in 150ms, `ease-in-strong` | It fades out; the space closes after | `Combobox` chips |
| arm | The next press acts – on this | The first press marks the target and says so; the second acts | The same, no motion | `Combobox` Backspace |
| roll | A count changed, and which way | The new digits slide in from below when it grows, from above when it shrinks, from 70% away, 200ms | The number changes in place | `Combobox` count and 「+N」 |
| tween | A measured value moved | The number counts to its new value in 300ms (`useRoll`) | It jumps | `UsageMeter`, `ContextWindow` |
| follow-height | The content grew or shrank | The measured height transitions in 200ms | It jumps | `Command` list, `Combobox` list and field |
| rise | A new line appeared | It fades in from 2–4px below, 200ms | Fade | Create rows, empty text, toasts |
| open | A surface came from its trigger | Fade, 4px from the trigger's side, scale 0.98 → 1, 200ms; it closes with a 150ms fade | Fade | `Combobox`, `Popover`, `Command` |
| turn | Open or closed | A chevron turns 180° – 90° for a disclosure – in 200ms | At once | `Combobox` toggle, `Chevron` |
| fold | Done with it, and still there if you look | It folds to a line or away – grid rows `1fr` → `0fr` with a fade, 200ms | At once | `ApprovalCard`, `DecisionInbox`, `ToolCallGroup` |
| shimmer | Work is going on in this line | A band sweeps across the text in 1.8s, linear, without end | No band; muted text | `Shimmer`, `ThinkingLoader`, steps |
| lift | The agent took it | It lifts and fades, 200ms | Fade | `MessageQueue` |
| sink | Put back where it came from | It sinks toward its source and fades | Fade | `MessageQueue` withdraw |

## Not ours yet

Seen in affectUI, measured, waiting for a component that needs them:

| Name | Means | How, as measured |
|---|---|---|
| receipt | What just happened, said where you'll look | The tray under the card shows ✓ and what ran, fading in from 3px over 260ms; back to the hint after 1.8s |
| preview | What will happen if you commit | Under the pointer before the click: a date range's band follows the pointer; a drop target says 「Release to upload 4 files」 |
| fan | Ready to take this | Stacked papers spread when files hover – ±30px and ±16°, 420ms; the middle one lifts 9px |
| shake | Refused | The row shakes ±3px four times over 380ms; the red reason stays |
| swap | The words changed, the place didn't | Old text leaves upward with a 2–3px blur in 320ms; the new rises in with the blur clearing, 360–460ms |
| stagger | Several arrived together, in this order | Each fades up 40–160ms after the one before |
| draw | Finished | A ✓ pops (0.5 → 1.12 → 1, 460ms) and its stroke draws in 360ms |
| pulse | Live right now | A dot breathes – scale and opacity – every 1.2–1.6s |
| trail | The run went one step further | The line down the steps grows to the new step, scaleY over 520ms |
| slot-in | It went there – to the step it changed | The item moves from the queue into its step, FLIP over 620ms, then a tint fades out over 1.4s |

## Rules

- One meaning per motion; two motions never mean the same thing
- Reuse before inventing; a new motion needs a moment no motion here answers
- Every motion has a reduced form that keeps the information – movement becomes a fade, loops stand still
- Nothing moves without a change in what it means; hover may color, never move
