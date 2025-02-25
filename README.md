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
- encore on encore is allowed ???!!!
- exchange bug: should NOT allow choosing of the same exchange card, otherwise only one person can choose it.

## FEEDBACK

- [x] **UI/UX Improvements**

  - [x] Display list of rooms on main page, in addition to create room / join room.
  - [x] Allow reading three cards at once, remove tags
  - [x] Display the name of the player making a request.

- [ ] **Gameplay Mechanics: Exchange System**

  - [ ] Exchange reset on subsequent round
  - [ ] Make the exchange tab available at all times.
  - [ ] Force matched exchanges in two-player mode.
  - [ ] Automatically transition to the exchange phase when both players agree.

- [ ] **Gameplay Modes and Features**

  - [ ] Limit encore mode to reuse existing cards only.
  - [ ] Start a new game with a fresh deck (no discard pile).

- [ ] **Implement remote play: audio**

- [ ] **Localization**
  - [ ] Translate the game into Vietnamese.

Good things

- 3 cards ok, mobile display ok

Questions

- Ripple ?

# TODO

- [ ] cards have two sides: question side and prompt side. Question side is most appropriate for Exchange.
- [ ] level 0 for playing with Bong

End/Start game

- [ ] Encore: allow individual players to vote: join encore round or not. If creator wants to encore, will exclude players who voted No
- [ ] End game: allow easy way to start a fresh game (cleared discards, reactions, etc)
- [ ] Add timers eg when clicked start, say game starts in 30 seconds, finalize your exchange card!

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
