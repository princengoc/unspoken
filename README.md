# Current PR

- [ ] Endgame edits:
  - [x] properly close the room.
  - [x] Allow room creators to delete a room
  - [x] Allow player to permanently leave a room
  - [ ] Allow direct player invitations (pre-approved join)
- [ ] audio player UI revamp
  - [ ] more obvious replay progress etc
  - [ ] more obvious that people can REPLY
  - [ ] CODEC issues? 44 MB for a few minutes is too much
- [ ] add permission from ALL players to "move on". Otherwise can leave topic.
  - [ ] indicate if someone else is recording, to stop game master from moving on prematurely, and to give progress info
  - [ ] revamp listener reactions for this
- [ ] auto-join after create and approved. Could show a Notification.

* **BUG / INEFFICIENCIES**:

- [ ] Transition / refresh: should look at implementation of listener reactions - this is "golden"
  - Currently: finish sharing doesn't transit for first speaker
  - Audio page often needs refreshing
- [ ] start game in IRL mode still loads audio

## FEEDBACK

UI

- [x] Improve instructions, text-based prefered
- [x] Move Sidenavbar to top, assume vertical mobile

IRL

- [x] Remove start speaking, just do finish speaking

Remote

- [x] iOS sound compat (?)

Content

- [x] level 0 for playing with Bong
- [x] Curate content
- [ ] Translate the game into Vietnamese.
- [ ] Add a language button (localized to player)

- **Room management**

- **Card history**
  - [x] Add card history
  - [x] Add personalization
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
