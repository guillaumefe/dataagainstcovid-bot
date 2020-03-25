var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.send('Welcome to the slackbot "community" for [data against covid-19](https://app.slack.com/client/TUQTGE7FU)')
});

// Prepare list of available "commands" and their answers
// in the object "commands"
// Load old format commands from commands.json
let commands = require('./commands.json');

let command_map = {
  "alias_to_cmd": {},
  "cmd_to_alias": {},
  // TODO: make command_map an object
  add_key: function(key, phrase) {
    // Function which adds command aliases to an alias -> command map
    lower_case_key = key.toLowerCase();
    this["alias_to_cmd"][phrase.toLowerCase()] = lower_case_key;
    this["alias_to_cmd"][phrase] = lower_case_key;
    if(lower_case_key in this["cmd_to_alias"]){
      this["cmd_to_alias"][lower_case_key].push(phrase);
    } else {
      this["cmd_to_alias"][lower_case_key] = [phrase];
    }
  }
};
console.log(command_map)

for (let key in commands) {
  command_map.add_key(key, key);
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
      command_map.add_key(new_key, phrase);
    });
  } catch (err) {
    new_key = command_file["command"];
    command_map.add_key(new_key, new_key);
  }
  commands[new_key.toLowerCase()] = command_file["answer"];
});

// Explore commands object for the available commands and list them into
// Slack markdown.
let command_list = "";
for (let key in commands) {
  command_list += ' :arrow_right:  ' + key + ' ';
  for (let i=1; i<command_map["cmd_to_alias"][key].length; i++){
    if (i==1){
      command_list += '(aka: ';
    }
    command_list += command_map["cmd_to_alias"][key][i]
    if (i==command_map["cmd_to_alias"][key].length-1){
      command_list += ')';
    } else {
      command_list += '; ';
    }
  }
  command_list += "\n";
}

console.log(command_map);
console.log(command_list);

// Responds to messages
app.post('/',function(req,res){
  let answer = ""
  if (req.body.text == "") {
      answer = require('./messages/_.json');
  } else if (req.body.text.toLowerCase() == "aide") {
      answer = require('./messages/aide.json');
      // store the command it in the empty section left in "aide.json"
      answer["blocks"][1]["text"]["text"] = command_list
  } else if (command_map["alias_to_cmd"][req.body.text.toLowerCase()]) {
      answer = commands[command_map["alias_to_cmd"][req.body.text.toLowerCase()]];
  } else {
      answer = require('./messages/unknown_command_error.json');
  }

  // A bit of console logging of the request
  console.log(req.body.trigger_id + ', ' + req.body.channel_name + ', '
    + req.body.user_name + ', ' + req.body.command + ', ' + req.body.text + ', '
  );

  console.log("request:")
  console.log(req.body)
  res.send(answer)

});

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT 8000");
})
