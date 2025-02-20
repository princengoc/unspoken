# Current PR


* [ ] add a notification icon when exchange have updates (eg new incoming, outgoing status changed)

Navbar improvements
* [x] add effects for buttons eg game phase (display explanations?)
* [x] remove unnecessary player side bar
* [x] Use stage icon for waiting, then Discard pile icon for Exchange




# TODO

* [ ] corner case handling: encore with ripple only but no exchange, no ripple cards, so no members have any cards to share. In this case:
    - draw random cards into the discard pile if it's empty
    - 
* [ ] cards have two sides: question side and prompt side. Question side is most appropriate for Exchange. 
* [ ] level 0 for playing with Bong

# Minor game logic changes

* [ ] Encore: allow individual players to vote: join encore round or not. If creator wants to encore, will exclude players who voted No
* [ ] Add timers eg when clicked start, say game starts in 30 seconds, finalize your exchange card!

# Minor UIs




Sign up
* [ ] signup form should require a username
* [ ] pasword field too small

In game
* [ ] change playerAvatar to an ActionIcon so that mouse over has a clickable effect

Speaking / Setup
* [ ] Improve asthetics: eg messages have borders instead of plain text
* [ ] More explanation texts, eg, at Start Sharing: encourage speaker to talk about stuff, encourage listening to react

Exchange tab
* [ ] use PlayerAvatar + name instead of first initial


Exchange card
* [ ] Show the "from_id" avatar in the bottom corner for the speaker

Card backgrounds
* [ ] Display backgrounds consistent to the mood assigned


# Minor backend
* [ ] merge game_states and rooms tables, remove game_state_id

# DONE
* [x] resume from given state
* [x] active player list not unique. Player needs to be able to rejoin
* [x] remove wild card logic
* [x] remove navbar header
* [x] profile edit: click on self icon, and should be an overlaid window that allows us to return to game
* [x] Navbar vs PlayerStatus
* [x] End game changes
    * [x] Get an "End Game" page
    * [x] Remove current vs total round. Always have one round, but  enable other settings (eg depth: filter for cards depth)
* [x] Enable depth filter
* [x] Improved Minicard display and PlayerAvatar consistency
* [x] Implement Ripple cards
* [x] Implment Exchange
* [x] Ripple and Exchange cards are displayed in the Encore round. 

## Bugs
* [ ] PlayerAvatar in end game is different from profile???
* [ ] game_state is created twice to the same room_id

