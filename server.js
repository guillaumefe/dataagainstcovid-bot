var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var request = require('request');

var app = express();

// TODO paackage the command infrastructure into a module or whatever JS 
// calls them
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

function commandsFromFolder(command_directory, commands, command_map) {
  // Explores all json files in a directory and looks for files matching the 
  // command format of objects with fields "command" and "answer"

  let command_files = fs.readdirSync(command_directory);
  for(i=0; i<command_files.length; i++) {
    item = command_files[i];
    
    command_file = require(command_directory + "/" + item);
    // Commands can have aliases, e.g. a shorter name to type
    let new_key = ""
    try { // assume there are multiple names for that command
      new_key = command_file["command"][0];  
      command_file["command"].forEach(function (phrase, _phrase_index){
        command_map.add_key(new_key, phrase);
      });
    } catch (err) { // Catch error from array access if there is a single name for the command
      new_key = command_file["command"];
      command_map.add_key(new_key, new_key);
    }
    // Match the answer to the principal command name (n.b. the first to appear)
    commands[new_key.toLowerCase()] = command_file["answer"];
  }
}


function generateCommandHelp(commands, command_map) {
  // Generates markdown text with the name of the commands 
  // and their known aliases.
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
  return command_list;
}
// ============================
/// Preprocessing
// ============================

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.send('Welcome to the slackbot "community" for [data against covid-19](https://app.slack.com/client/TUQTGE7FU)')
});


// Collect valid commands from commands.json and messages/commands/ folder 
// and messages/commands_hidden
let commands = require('./commands.json'); // simple text commands
for (let key in commands) {
  command_map.add_key(key, key);
}
// Parse commands in folders
commandsFromFolder('./messages/commands/', commands, command_map);
let command_list = generateCommandHelp(commands, command_map);

console.log(command_map);
console.log(command_list);

// ============================
/// Event handling
// ============================

function respondToCommand(incoming_cmd) {
  // Respond to a command that was received.
  let answer = ""
  if (incoming_cmd == "") {
      answer = require('./messages/_.json');
  } else if (incoming_cmd.toLowerCase() == "aide") {
      answer = require('./messages/aide.json');
      // store the command it in the empty section left in "aide.json"
      answer["blocks"][1]["text"]["text"] = command_list
  } else if (command_map["alias_to_cmd"][incoming_cmd.toLowerCase()]) {
      answer = commands[command_map["alias_to_cmd"][incoming_cmd.toLowerCase()]];
  } else {
      answer = require('./messages/unknown_command_error.json');
  }
  return answer;
}

// Responds to messages sent by user
app.post('/',function(req,res){
  req_type = 'slash_command';
  answer = respondToCommand(req.body.text);
  // A bit of console logging of the request
  console.log(req.body.trigger_id + ', ' + req.body.channel_name + ', '
    + req.body.user_name + ', ' + req.body.command + ', ' + req.body.text + ', '
    + req_type + ','
  );
  res.send(answer)
});

// Responds to interactive commands
// Following block format:
// https://api.slack.com/interactivity/handling
app.post('/response',function(req,res){
  res.sendStatus(200); // First send the acknowledgement
  req_type = 'user_interaction';

  // Parse the payload, aka the bit of interest
  req_payload = JSON.parse(req.body.payload);
  // Extract the button value, which must match a command
  incoming_cmd = req_payload.actions[0].value;
  answer = respondToCommand(incoming_cmd);
  
  let log_line = req_payload.trigger_id + ', ' + req_payload.channel.name + ', '
  + req_payload.user.username + ', ' + req_payload.type + ', ' 
  + req_payload.actions[0].action_id + ', ' + req_type + ',';
  console.log(log_line);

  answer.text  = "Answering : " + log_line; // Add detail of question
  answer.replace_original= false;
  request.post({ 
      headers: {'content-type' : 'application/json'}, 
      url: req_payload.response_url,
      body: JSON.stringify(answer)
    }, function(error, response, body){}); 
  
});

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT 8000");
})
