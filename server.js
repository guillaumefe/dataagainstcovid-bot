var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.send('Welcome to the slackbot "community" for [data against covid-19](https://app.slack.com/client/TUQTGE7FU)')
});

// Prepare list of available commands
// Load old format commands from commands.json
let commands = require('./commands.json');
let command_map = {};

function add_to_command_map (map, key, phrase) {
  // Function which adds command aliases to an alias -> command map
  map[phrase.toLowerCase()] = key.toLowerCase();
  map[phrase] = key.toLowerCase();
}

for (let key in commands) {
  add_to_command_map(command_map, key, key);
}
// Collect valid commands from commands.json and messages/commands/ folder 
let command_files_dir = './messages/commands/';
let command_files = fs.readdirSync(command_files_dir);

command_files.forEach(function (item, index) {
  command_file = require(command_files_dir + "/" + item);
  let new_key = ""
  try {
    new_key = command_file["command"][0];
    command_file["command"].forEach(function (phrase, _phrase_index){
      add_to_command_map(command_map, new_key, phrase);
    });
  } catch (err) {
    new_key = command_file["command"];
    add_to_command_map(command_map, new_key, new_key);
  }
  commands[new_key.toLowerCase()] = command_file["answer"];
});
console.log(command_map);

app.post('/',function(req,res){
  let answer = ""
  //TODO
  // Adapt code to search messages/ dir and not in commands object
  if (req.body.text == "") {
      answer = require('./messages/_.json');
  } else if (req.body.text.toLowerCase() == "aide") {
      answer = require('./messages/aide.json');
      // Explore commands object for the available commands and list them.
      let command_list = "";
      for (let key in commands) {
        command_list += ' :arrow_right:  ' + key + '\n'
      }
      // store it in the empty section left in "aide.json"
      answer["blocks"][1]["text"]["text"] = command_list
  } else if (command_map[req.body.text.toLowerCase()]) {
      answer = commands[command_map[req.body.text.toLowerCase()]];
  } else {
      answer = require('./messages/unknown_command_error.json');
  }

  // A bit of console logging of the request
  console.log(req.body.trigger_id + ', ' + req.body.channel_name + ', '
    + req.body.user_name + ', ' + req.body.command + ', ' + req.body.text + ', ');

  res.send(answer)

});

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT 8000");
})
