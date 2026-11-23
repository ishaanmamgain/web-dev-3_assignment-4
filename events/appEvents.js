const { EventEmitter } = require('events');

// Single shared emitter. Listeners live here so all reactions are in one place.
const appEvents = new EventEmitter();
appEvents.setMaxListeners(20);

appEvents.on('user:registered', (user) => {
  console.log(`[event] Welcome aboard, ${user.username}! Account created for ${user.email}`);
});

appEvents.on('user:loggedIn', (user) => {
  console.log(`[event] ${user.username} logged in at ${new Date().toISOString()}`);
});

appEvents.on('note:created', (note) => {
  console.log(`[event] Note created: "${note.title}" by owner ${note.owner}`);
});

appEvents.on('note:deleted', ({ id, owner }) => {
  console.log(`[event] Note deleted: ${id} (owner ${owner})`);
});

appEvents.on('chat:message', ({ room, user, message }) => {
  console.log(`[event] chat:message in ${room} from ${user}: ${message}`);
});

module.exports = appEvents;
