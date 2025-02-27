# Current PR

- [ ] Endgame edits:
  - [x] do NOT allow multiple encore.
  - [ ] properly close the room.
- [x] Improve explanation texts.
- [x] Vercel publish!

## Feedback

- [ ] tag system confusing
- [ ] back button -- don't know how to rejoin room
- [ ] redo card choice (?)
- [ ] help system not obvious
- [ ] exchange system undiscovered by first player
- [ ] encore with just a single card choosing is confusing
- [ ] need auto-switch (?) between phase tab and exchange tab

* **BUG**:

- finish sharing doesn't transit for first speaker (RLS policy on rooms? Mobile device issues?)

## FEEDBACK

UI

- [ ] Improve instructions, text-based prefered
- [ ] Move Sidenavbar to top, assume vertical mobile

IRL

- [x] Remove start speaking, just do finish speaking

Remote

- [ ] mp3 for iOS compat

Content

- [ ] level 0 for playing with Bong
- [ ] Curate content
- [ ] Translate the game into Vietnamese. Add a language button (localized to player)

- **Room management**

  - [ ] Allow room creators to delete a room
  - [ ] Allow player to permanently leave a room
  - [ ] Allow direct player invitations (pre-approved join)

- **Card history**
  - [ ] Add card history
  - [ ] Add personalization
- **Bug**
- [ ] Exchange: should not allow choosing of same card (server-side update of in_play?)

Good things

- 3 cards ok, mobile display ok

Questions

- Ripple ?

# TODO

- [ ] cards have two sides: question side and prompt side. Question side is most appropriate for Exchange.

# Minor UIs

getPlayerAssignment

- [ ] player order should be by first joined in room, otherwise new player joining will cause player icons to change

Exchange tab

- [ ] use PlayerAvatar + name instead of first initial

Exchange card

- [ ] Show the "from_id" avatar in the bottom corner for the speaker

Card backgrounds

- [ ] Display backgrounds consistent to the mood assigned

Card

- [ ] Main card display corner icons like Minicard

# Bugs

# DONE

- [x] resume from given state
- [x] active player list not unique. Player needs to be able to rejoin
- [x] remove wild card logic
- [x] remove navbar header
- [x] profile edit: click on self icon, and should be an overlaid window that allows us to return to game
- [x] Navbar vs PlayerStatus
- [x] End game changes
  - [x] Get an "End Game" page
  - [x] Remove current vs total round. Always have one round, but enable other settings (eg depth: filter for cards depth)
- [x] Enable depth filter
- [x] Improved Minicard display and PlayerAvatar consistency
- [x] Implement Ripple cards
- [x] Implment Exchange
- [x] Ripple and Exchange cards are displayed in the Encore round.
- Navbar improvements
  - [x] add effects for buttons eg game phase (display explanations?)
  - [x] remove unnecessary player side bar
  - [x] Use stage icon for waiting, then Discard pile icon for Exchange
  - [x] add a notification icon when exchange have updates (eg new incoming, outgoing status changed)
- [x] Decline all other unmatched requests once hasMatch is true (handled automatically on server)
- Sign up
  - [x] signup form should require a username
  - [x] pasword field too small
- [x] change playerAvatar to an ActionIcon so that mouse over has a clickable effect
- [x] merge game_states and rooms tables, remove game_state_id
- [x] performance efficiencies
  - [x] select exactly columns needed
  - [x] remove consecutive calls
  - [x] make startNextRound and draw cards more efficient
- [x] corner case handling: encore with ripple only but no exchange, no ripple cards, so no members have any cards to share.

- [x] **Implement remote play: audio**
  - [x] read game_mode: only allow voice for "remote" play (not "irl")
  - [x] "remote" play logic
    - [x] allow recording of message at setup. These are public messages.
    - [x] speaking phase is just to review public messages. There will be a grid of "here are the shared messages" with icons underneath.
    - [x] speaking phase has no "active player".
    - [x] player can choose to respond to specific player's cards as public or private.
- [x] after recording, should mark player status as "has_spoken: true", and if has_spoken, then do NOT show the recording button.
- [x] isComplete in setup should be after people have all spoken, NOT after they have selected.

- [x] **UI/UX Improvements**

  - [x] Display list of rooms on main page, in addition to create room / join room.
  - [x] Allow reading three cards at once, remove tags
  - [x] Display the name of the player making a request.
  - [x] Room Settings: allow card depth filter

- [x] **Gameplay Mechanics: Exchange System**

  - [x] Make the exchange tab available at all times.
  - [x] Exchange reset on subsequent round
  - [x] Automatically transition to the exchange phase when available

- [x] **Gameplay Modes and Features**

  - [x] Start a new game with a fresh deck (no discard pile).
