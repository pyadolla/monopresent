# Shared pointer

Moving the mouse over the slide in **presenter** mode draws a dot at the same
place in the **fullscreen** window. The presenter can watch their own screen and
point at things on the one behind them.

In the fullscreen window the mouse behaves normally and broadcasts nothing.

Implemented in `monopresent/packages/immersion-presentation/src/Presentation.tsx`,
with one supporting change in
`monopresent/packages/example-presentation/src/websocketServer.js`.

---

## 1. Using it

1. Start the websocket server (port 3003). Without it the windows do not sync at
   all, pointer or otherwise, and the deck logs `ERR_CONNECTION_REFUSED` on load.
2. Open two **windows** — not two tabs, since you need to see both:
   - `http://localhost:3000/presenter/0/0`
   - `http://localhost:3000/fullscreen/0/0`
3. Move the mouse over the slide area of the presenter window.

The dot disappears when the pointer leaves the slide — over the notes, the clock,
or outside the window — rather than parking at the nearest edge.

---

## 2. Why it sends fractions, not pixels

This is the whole design, and everything else follows from it.

The presenter pane and the audience window show the same slide at different
sizes and different offsets. Measured live:

| | slide box |
|---|---|
| presenter, live pane | 1200 × 852 at (0, 0) |
| presenter, next-step preview | 600 × 426 at (1200, 0) |
| fullscreen, visible slide | 1200 × 852 at (200, 50) |

So a pixel coordinate from one window means nothing in the other. What travels
over the socket is the position as a **fraction of the slide box**, 0..1 on each
axis, measured against the `.slide` element:

```js
const r = liveSlideEl().getBoundingClientRect()
const x = (e.clientX - r.left) / r.width
const y = (e.clientY - r.top)  / r.height
```

The receiving window multiplies by its own `.slide` rect. That is correct at any
pane size, any window size, and at any zoom level — including the per-window
zoom feature, because the rect is measured from the live DOM rather than assumed.

Message shape:

```json
{ "type": "pointer", "x": 0.43, "y": 0.61 }
{ "type": "pointer", "hidden": true }
```

---

## 3. Two things that were not obvious

**The live slide is not the first `.slide` in the DOM.** Fullscreen renders three
— previous, current and next — and the first is the *outgoing transition ghost*,
which during a transition is scaled to 13632 × 9679 at opacity 0. Positioning a
dot against that rect puts it thousands of pixels off screen. Presenter renders
two, and there the first one *is* the live pane. `liveSlideEl()` therefore picks
the **most visible** element, which is correct in both modes:

```js
const liveSlideEl = () => {
  const all = Array.from(document.querySelectorAll('.slide'))
  // ...return the one with the highest computed opacity, earliest on a tie
}
```

**The socket client assumed every message was navigation.** `ws.onmessage`
destructured `{ slideIndex, stepIndex }` and called `setSlideAndStep`
unconditionally, so a pointer message would have called
`setSlideAndStep(undefined, undefined)` and broken slide sync entirely. Pointer
messages now branch out before reaching it.

---

## 4. Performance

The first working version stuttered and trailed the real cursor. Three causes,
all in the receiver, all fixed:

| Cause | Fix |
|---|---|
| `getBoundingClientRect()` on **every** message forced a synchronous layout ~60×/s | Rect is cached; refreshed on `resize` and once a second as a safety net for zoom |
| Positioning with `left`/`top` relayouts and repaints every frame | `translate3d(...)` with `will-change: transform` — composited on the GPU, no layout |
| A React re-render per message | The dot renders once when it appears; updates write `style.transform` directly through a ref, coalesced to one write per animation frame |

A `transition: left 0.04s, top 0.04s` in the first version was *adding* 40 ms of
lag rather than smoothing anything, and is gone.

**Transport.** The websocket server rebroadcast the raw `Buffer`, which the
browser receives as a **binary** frame, so the client ran `await blob.text()` on
every message — an async hop 60 times a second. The server now sends text frames:

```js
const text = typeof message === 'string' ? message : message.toString()
```

The client already handled both, so this needed no client change.

**Measured after.** Sweeping 41 positions produced **42 distinct dot positions
across 101 animation frames** — one update per input, none dropped — and the dot
landed within 2 px of the expected point at every fraction tested.

Note that this removes the *local* overhead only. Round-trip latency to a remote
host still applies. If the dot visibly trails over an SSH tunnel, that is network
latency, not rendering, and the fix would be interpolating between updates.

---

## 5. Changing it

| Want | Where |
|---|---|
| Size, colour, glow | the inline style in `RemotePointer` — currently a 10 px circle at `rgba(220,38,38,0.9)` with an 8 px glow |
| Broadcast from a different mode | `useBroadcastPointer(ws, props.mode === 'presenter')` |
| Show the dot in another mode | add `<RemotePointer />` to that branch's return; it takes no props |
| Disable entirely | remove the `useBroadcastPointer(...)` call — receivers then never get a message |

`RemotePointer` is `pointer-events: none` at `zIndex: 9999`, so it can never
intercept a click or be obscured by slide content.

---

## 6. Limitations

- **Presenter only.** Fullscreen deliberately does not broadcast, so you cannot
  point from the audience window.
- **One pointer.** The store holds a single position, so two presenters pointing
  at once would fight over it.
- **No trail or fade.** The dot is either at a position or hidden.
- **The hook is order-sensitive.** `useBroadcastPointer(ws, ...)` must come after
  the `ws` useMemo. Calling it earlier throws `Cannot access 'ws' before
  initialization`, which blanks the entire app — it is a hard failure, not a
  degraded one.

---

## 7. Reverting

Both changes are on the `genbio-latex-speedup` branch in commit
`4d148df`. To drop just this feature while keeping the rest of the branch:

```bash
git revert 4d148df
```

Or by file, if only part of it is unwanted:

```bash
git checkout 2a101c1 -- monopresent/packages/immersion-presentation/src/Presentation.tsx
git checkout 2a101c1 -- monopresent/packages/example-presentation/src/websocketServer.js
```

The text-frame change in the server is independent of the pointer and worth
keeping either way: it reduces latency for the existing slide-sync messages too.
