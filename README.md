## FEEDBACK June 10th 2025

Feedback received after playing games with a group of friends. 
- Need clearer instructions. Exchange mechanic confusing. No "downtime" needed. 
- Make intro compulsory (remove "Skip intro" for players not logged in).
- Cards content too hard, needs a gradual "party" level to warm people up to the idea of sharing thoughts. 
- Card background / color should match mood / difficulty. Lack of visual cues make it hard for people to be in the mood to share. 


## Current PR

Mechanics
- [ ] Remove async exchange. Turn into two-round game: first pick card / share. Then pick card for others to share.  
- [ ] Fix difficulty: warm-up, deeper etc
- [ ] Perhaps add a collaboration aspect: need to clear 6 warm-up cards to get to harder levels.

UI
- [ ] Display backgrounds consistent to the mood assigned
- [ ] Simplify UI to be more linear, at each step there is exactly one action button. 



## Other TODOs

- [ ] Endgame edits:
  - [ ] Allow direct player invitations (pre-approved join)
- [ ] audio player UI revamp
  - [ ] CODEC issues? 44 MB for a few minutes is too much
- [ ] add permission from ALL players to "move on". Otherwise can leave topic.
  - [ ] indicate if someone else is recording, to stop game master from moving on prematurely, and to give progress info
  - [ ] revamp listener reactions for this
- [ ] auto-join after create and approved. Could show a Notification.

* **BUG / INEFFICIENCIES**:

- [ ] start game in IRL mode still loads audio
- [ ] need to implement webm to mp4 for playback on iOS


Content

- [ ] Translate the game into Vietnamese.
- [ ] Add a language button (localized to player)

# Minor UIs

getPlayerAssignment

- [ ] player order should be by first joined in room, otherwise new player joining will cause player icons to change

Exchange tab

- [ ] use PlayerAvatar + name instead of first initial

Exchange card

- [ ] Show the "from_id" avatar in the bottom corner for the speaker

Card

- [ ] Main card display corner icons like Minicard

# Bugs

# DONE

- [x] more obvious replay progress etc
- [x] more obvious that people can REPLY
- [x] properly close the room.
- [x] Allow room creators to delete a room
- [x] Allow player to permanently leave a room

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
