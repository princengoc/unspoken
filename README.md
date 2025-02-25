# Current PR

- [ ] Endgame edits:
  - [x] do NOT allow multiple encore.
  - [ ] properly close the room.
- [x] Improve explanation texts.
- [ ] Vercel publish!

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
