# Shared pointer

Moving the mouse over a slide draws a red dot at the same place in the other
window, and **replaces the native cursor** while it is over the slide. It works
in both directions: point from the presenter window or from the fullscreen one,
whichever the mouse is in.

Implemented in `monopresent/packages/immersion-presentation/src/Presentation.tsx`,
with one supporting change in
`monopresent/packages/example-presentation/src/websocketServer.js`.

---

## 1. Using it

1. Start the websocket server (port 3003). Without it the windows do not sync at
   all, pointer or otherwise, and the deck logs `ERR_CONNECTION_REFUSED` on load.
   Two windows in the same browser will still mirror the pointer — that path does
   not use the socket — but they will not follow each other's slides.
2. Open two **windows** — not two tabs, since you need to see both:
   - `http://localhost:3000/presenter/0/0`
   - `http://localhost:3000/fullscreen/0/0`
3. Move the mouse over the slide area of either one.

The dot disappears, and the real cursor comes back, as soon as the pointer leaves
the slide — over the notes, the clock, the next-step preview, or the margin around
the fullscreen slide.

### Which modes

| Mode | URL | Dot | Broadcasts |
|---|---|---|---|
| `presenter` | `/presenter/:slide/:step` | yes, over the live pane only | yes |
| `fullscreen` | `/fullscreen/:slide/:step` | yes | yes |
| `edit` | `/:slide/:step` (the default route) | no | no |
| `embed` | no route — the `embed` prop | no | no |
| `overview` | `/overview` | no | no |

`edit` is deliberately excluded: the animation editor sits beside the slide and
needs a real cursor to click in.

---

## 2. Why it sends fractions, not pixels

This is the whole design, and everything else follows from it.

The two windows show the same slide at different sizes, at different offsets,
and — since zoom is per-window — at different scales. Measured live:

| | slide box |
|---|---|
| presenter, live pane | 1200 × 852 at (0, 0) |
| presenter, next-step preview | 600 × 426 at (1200, 0) |
| fullscreen, visible slide | 1200 × 852 at (200, 50) |

So a pixel coordinate from one window means nothing in the other. What travels
is the position as a **fraction of the slide box**, 0..1 on each axis, measured
against the `.slide` element:

```js
const r = liveSlideEl().getBoundingClientRect()
const x = (e.clientX - r.left) / r.width
const y = (e.clientY - r.top)  / r.height
```

The receiving window multiplies by its own `.slide` rect. Because that rect is
measured from the live DOM rather than assumed, it is correct at any pane size,
window size and zoom level. Verified with the two windows at **different** zooms
(0.75 and 0.83): the mirrored dot still lands within 1.3 px.

Message shape — `src` and `seq` are explained in §4:

```json
{ "type": "pointer", "x": 0.43, "y": 0.61, "src": "k3f9qa", "seq": 812 }
{ "type": "pointer", "hidden": true,      "src": "k3f9qa", "seq": 813 }
```

---

## 3. Four things that were not obvious

**The live slide is not the first `.slide` in the DOM.** Fullscreen renders three
— previous, current and next — and the first is the *outgoing transition ghost*,
which during a transition is scaled to 13632 × 9679 at opacity 0. Positioning a
dot against that rect puts it thousands of pixels off screen. Presenter renders
two, and there the first one *is* the live pane. `liveSlideEl()` therefore picks
the **most visible** element, which is correct in both modes.

**The socket client assumed every message was navigation.** `ws.onmessage`
destructured `{ slideIndex, stepIndex }` and called `setSlideAndStep`
unconditionally, so a pointer message would have called
`setSlideAndStep(undefined, undefined)` and broken slide sync entirely. Pointer
messages branch out before reaching it.

**`mouseout` on the window is the wrong leave event.** It bubbles, so it fires on
every element boundary *inside* the slide — over each SVG path — which blinked the
dot off for a frame. Tolerable when the dot was decoration, not when it is the
cursor. It is now `mouseleave` on the document, which fires only when the cursor
leaves the viewport, plus `blur` on the window, which covers alt-tabbing away —
where no mouse event fires at all and the dot would otherwise stay painted in
the peer window.

**A transform makes an element the containing block for `position: fixed`
descendants.** The dot is `position: fixed` and positioned from viewport
coordinates, so the per-window zoom transform must not be applied to any ancestor
of it. In presenter mode the transform goes on the inner flex div and
`<SlidePointer />` stays outside it; in fullscreen the dot is already a sibling of
the scaled div. Getting this wrong rescales the dot and measures it against the
wrong box.

---

## 4. Latency

The dot is the cursor now, so lag is not cosmetic. Four things were costing time.

**The window you are moving in should not use the network at all.** It draws from
its own mouse position; the remote position is only a fallback. One dot per
window, and your own is never late.

**The peer should not use the network either, when it is in the same browser.**
Two windows of the same deck are the same origin, so they also have
`BroadcastChannel`. Measured side by side on the same machine:

| transport | one-way, 180 messages |
|---|---|
| websocket via port 3003 | median 2.0 ms, p90 3.0 ms |
| BroadcastChannel | median 0.7 ms, p90 1.9 ms |

That 2 ms is the socket with the server *on the same host*. In the setup this deck
is presented from, the server is on a compute node behind an SSH tunnel, so every
update went out through the tunnel and back — two traversals per mouse move, tens
of milliseconds. Updates now go over **both** transports. BroadcastChannel wins
whenever the peer is in this browser; the socket is what reaches a window in
another browser or on another machine.

**Two `requestAnimationFrame` hops were adding a frame each.** The sender
coalesced to one send per frame, and the receiver painted from a frame callback.
The browser already coalesces `mousemove` to one event per displayed frame, so
the sender's rAF reduced nothing and only delayed the send; and setting
`transform` does not force layout, so the receiver can write it on arrival and
let the compositor pick it up at the next frame either way. Both are gone. A 4 ms
floor on sends guards against platforms that deliver moves faster than the frame
rate.

**Sending twice means an update can arrive twice**, and the slower copy carries a
stale position, which would drag the dot backwards. Each window stamps messages
with an id (`src`) and a counter (`seq`), and a receiver drops anything not newer
than what it already applied from that sender. A peer on an older build sends
neither field; those messages are taken as they come.

### Measured end to end

Mouse move in one window to the dot moving in the other, 120-position sweep:

| | before | after |
|---|---|---|
| server on the same host | median 32.9 ms | **median 9.7 ms** |
| server behind a simulated 30 ms tunnel | median 50.1 ms | **median 9.1 ms** |

100% of moves arrive and are drawn in all four runs — nothing is dropped to buy
the latency. Note the second row: after the change the tunnel delay no longer
appears in the figure at all, because the pointer never goes through it.

Earlier fixes still in place, from when the dot first stuttered: the slide rect is
cached rather than measured on every message (which forced a synchronous layout
~60×/s), the dot moves by `translate3d` with `will-change: transform` rather than
`left`/`top`, and it updates by a direct style write through a ref rather than a
React re-render. A `transition: left 0.04s, top 0.04s` in the first version was
*adding* 40 ms of lag rather than smoothing anything, and is gone.

The cached rect is refreshed on `resize`, on the `immersion:zoom` event, and once
a second as a safety net. The zoom event matters: a zoom moves the slide box
without firing a resize, and without the signal the dot measured against the old
rect for up to a second afterwards — landing 15 px off in testing.

---

## 5. Changing it

| Want | Where |
|---|---|
| Size, colour, glow | the inline style in `SlidePointer` — currently a 10 px circle at `rgba(220,38,38,0.9)` with an 8 px glow |
| Keep the native cursor as well as the dot | remove `cursor: 'none'` from the presenter and fullscreen slide boxes |
| Which modes point | the `useSlidePointer(ws, bc, ...)` enable expression |
| Show the dot in another mode | add `<SlidePointer />` to that branch's return; it takes no props, but keep it out of any transformed ancestor |
| Disable entirely | remove the `useSlidePointer(...)` call — receivers then never get a message |

`SlidePointer` is `pointer-events: none` at `zIndex: 9999`, so it can never
intercept a click or be obscured by slide content.

---

## 6. Limitations

- **One pointer.** The store holds a single position, so two people pointing at
  once would fight over it.
- **No trail or fade.** The dot is either at a position or hidden.
- **Across machines it still pays the network.** `BroadcastChannel` only reaches
  windows in the same browser. A window on a different machine falls back to the
  socket and its round trip. If the dot visibly trails in that configuration, the
  remaining fix would be interpolating between updates — which trades lag for
  smoothness rather than removing it.
- **The hook is order-sensitive.** `useSlidePointer(ws, bc, ...)` must come after
  the `ws` and `bc` useMemos. Calling it earlier throws `Cannot access 'ws'
  before initialization`, which blanks the entire app — a hard failure, not a
  degraded one.

---

## 7. Reverting

On the `genbio-latex-speedup` branch:

| Commit | What |
|---|---|
| `4d148df` | the original one-directional pointer |
| `9a8bb7e` | two-way, and the dot replaces the cursor |
| `83d8bb4` | per-window zoom widened to both windows and to the wheel |
| `f872635` | BroadcastChannel transport, and both rAF hops removed |

To drop a single step, `git revert <commit>`. To drop the pointer entirely while
keeping the rest of the branch, revert all three and then
`git checkout 2a101c1 -- monopresent/packages/immersion-presentation/src/Presentation.tsx`.

The text-frame change in the websocket server (`4d148df`) is independent of the
pointer and worth keeping either way: it reduces latency for the slide-sync
messages too.
