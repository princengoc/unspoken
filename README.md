# TODO

* [ ] Navbar vs PlayerStatus
* [ ] End game changes
    * [ ] Get an "End Game" page
    * [ ] Remove current vs total round. Always have one round, but  enable other settings (eg depth: filter for cards depth)
* [ ] Let game settings be different icons on the toolbar
* [ ] Implement Ripple cards
* [ ] Implment Exchange

# Minor game logic changes


* [ ] Ripple and Exchange cards are displayed in the Encore round. 


# Minor UIs
* [ ] signup form should require a username
* [ ] pasword field too small
* [ ] add effects for buttons eg game phase (display explanations?)
* [ ] change playerAvatar to an ActionIcon so that mouse over has a clickable effect


# Minor backend
* [ ] merge game_states and rooms tables

# DONE
* [x] resume from given state
* [x] active player list not unique. Player needs to be able to rejoin
* [x] remove wild card logic
* [x] remove navbar header
* [x] profile edit: click on self icon, and should be an overlaid window that allows us to return to game

## Bugs

* [ ] game_state is created twice to the same room_id

