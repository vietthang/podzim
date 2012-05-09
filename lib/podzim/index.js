var podzim = require('derby').createApp(module)
  , get = podzim.get
  , view = podzim.view
  , ready = podzim.ready
  , start

// ROUTES //

start = +new Date()

// Derby routes can be rendered on the client and the server
/*get('/:roomName?', function(page, model, params) {
  var roomName = params.roomName || 'home'

  // Subscribes the model to any updates on this room's object. Calls back
  // with a scoped model equivalent to:
  //   room = model.at('rooms.' + roomName)
  model.subscribe('rooms.' + roomName, function(err, room) {
    model.ref('_room', room)

    // setNull will set a value if the object is currently null or undefined
    room.setNull('welcome', 'Welcome to ' + roomName + '!')

    room.incr('visits')

    // This value is set for when the page initially renders
    model.set('_timer', '0.0')
    // Reset the counter when visiting a new route client-side
    start = +new Date()

    // Render will use the model data as well as an optional context object
    page.render({
      roomName: roomName
    , randomUrl: parseInt(Math.random() * 1e9).toString(36)
    })
  })
})*/

podzim.get('/videos/:id', function(page, model, params){
  var id = params.id;
  if(!id) page.render('404', {url : 'a'});

  model.unsubscribe();

  model.subscribe('videos.' + id, function(err, video){
    model.ref('_video', video);

    video.at('visitors').push(model.get('user'));

    function onDisconnect(){
      var visitors = model.get('videos.' + id + '.visitors');
      for(var i=0, len=visitors.length; i<len; i++){
        if(visitors.email === model.get('user.email')){
          visitors.splice(i, 1);
        }
      }

      model.set('videos.' + id + '.visitors', visitors);

      model.socket.removeListener('disconnect', onDisconnect);
    }

    if(model.socket){
      model.socket.on('disconnect', onDisconnect);
    }

    page.render('video', {});
  });
});

/*podzim.get('/videos/:q?', function(page, model, params){
  var q = params.q;

  if(q){
    // request to youtube api to get back videos (old podzim.search) TODO
    Helper.search(q, function(err, videos){
      model.ref('_search', videos);
    });
  }else{
    // render default search page
  }
});*/

// CONTROLLER FUNCTIONS //

ready(function(model) {
  var timer

  // Expose the model as a global variable in the browser. This is fun in
  // development, but it should be removed when writing an app
  window.model = model

  // Exported functions are exposed as a global in the browser with the same
  // name as the module that includes Derby. They can also be bound to DOM
  // events using the "x-bind" attribute in a template.
  exports.stop = function() {

    // Any path name that starts with an underscore is private to the current
    // client. Nothing set under a private path is synced back to the server.
    model.set('_stopped', true)
    clearInterval(timer)
  }

  exports.start = function() {
    model.set('_stopped', false)
    timer = setInterval(function() {
      model.set('_timer', (((+new Date()) - start) / 1000).toFixed(1))
    }, 100)
  }
  exports.start()


  model.set('_showReconnect', true)
  exports.connect = function() {
    // Hide the reconnect link for a second after clicking it
    model.set('_showReconnect', false)
    setTimeout(function() {
      model.set('_showReconnect', true)
    }, 1000)
    model.socket.socket.connect()
  }

  exports.reload = function() {
    window.location.reload()
  }

})
