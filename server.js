const express = require("express");
const bodyParser = require("body-parser");
const request = require('request');
const favicon = require('serve-favicon')
const path = require('path')
const crypto = require('crypto');

const app = express();

// TODO package the command infrastructure into a module
const command_infrastructure = require('./commands');
const command_map = command_infrastructure.command_map
const commandsFromFolder = command_infrastructure.commandsFromFolder
const generateCommandHelp = command_infrastructure.generateCommandHelp
const respondToCommand = command_infrastructure.respondToCommand
const cmd_list_prefix = command_infrastructure.cmd_list_prefix
const cmd_list_alias_pre = command_infrastructure.cmd_list_alias_pre
const cmd_list_alias_sep = command_infrastructure.cmd_list_alias_sep
const cmd_list_alias_post = command_infrastructure.cmd_list_alias_post
const commands =  command_infrastructure.commands

const PrepareSpecialAnswers = function(command_lists, commands, command_map) {
  // Prepares answers that need additional combining 
  // aide; documentation and doc-dec all parse a list of commands into the
  // message
  for (const incoming_cmd in command_lists) {
    const answer = commands[command_map.alias_to_cmd[incoming_cmd.toLowerCase()]];
    // store the command it in the empty section left in "aide.json"
    console.log(incoming_cmd);
    answer.blocks[1].text.text = command_lists[incoming_cmd];
    // Create a drop down list with up to date actions
    if (answer.blocks.length >=4 && answer.blocks[3].type == "actions" 
      && answer.blocks[3].elements[0].type == "static_select"){
        // Get a template element
        default_opt = JSON.stringify(answer.blocks[3].elements[0].options[0]);
        answer.blocks[3].elements[0].options.length = 0; // delete dropdown options
        command_lists[incoming_cmd].split("\n").forEach(function(list_line, l_index){
          // Extract the command form the list_line
          list_cmd = list_line.slice(cmd_list_prefix.length).split(cmd_list_alias_pre)[0];
          if (!command_map["alias_to_cmd"][list_cmd.toLowerCase()]){
            list_cmd = "D, la réponse D."
          }
          // Deep copy of default option
          answer.blocks[3].elements[0].options.push(JSON.parse(default_opt));
          // Assign to drop down options
          answer.blocks[3].elements[0].options[l_index].text.text = list_cmd;
          answer.blocks[3].elements[0].options[l_index].value = list_cmd;
        });
        console.log(JSON.stringify(answer.blocks[3]));
    }
    commands[command_map.alias_to_cmd[incoming_cmd.toLowerCase()]] = answer;
  }
}

// ============================
/// Preprocessing
// ============================

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.send('Welcome to the slackbot "community" for [data against covid-19](https://app.slack.com/client/TUQTGE7FU)')
});

// Collect valid commands from commands.json and messages/commands/ folder 
// and messages/commands_hidden
// Parse commands in folders
const command_lists = {};
commandsFromFolder('./messages/commands_prioritaires/', commands, command_map);
command_lists["aide"] = generateCommandHelp(commands, command_map);
commandsFromFolder('./messages/commands/', commands, command_map);
command_lists["documentation"] = generateCommandHelp(commands, command_map);
commandsFromFolder('./messages/commands_hidden/', commands, command_map);
command_lists["doc-dev"] = generateCommandHelp(commands, command_map);

PrepareSpecialAnswers(command_lists, commands, command_map);

console.log(command_map);
console.log(command_lists);

// ============================
/// Event handling
// ============================

function privateLogLine(trigger_id, channel, user_name, payload_type, 
  action, request_type){
  console.log(user_name);
  // only hexadecimal digits
  let hashed_user_name = "";
  try {
    hashed_user_name = crypto.createHash('sha1').update(user_name).digest('hex'); 
  } catch (error) {
    hashed_user_name = "hasherror";
  }
  
  return trigger_id + ', ' + channel + ', ' + 'userid_' + hashed_user_name 
  + ', ' + payload_type + ', ' + action + ', ' + request_type + ',';

}

// Responds to messages sent by user
app.post('/',function(req,res){
  req_type = 'slash_command';
  answer = respondToCommand(req.body.text);
  // A bit of console logging of the request
  console.log(privateLogLine(req.body.trigger_id, req.body.channel_name, req.body.user_name,
     req.body.command , req.body.text ,req_type));
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
  // Extract the interaction value, which must match a command
  let incoming_cmd = "";
  let action_log = "";
  if(req_payload.actions[0].type == "button"){
    incoming_cmd = req_payload.actions[0].value;
    action_log = req_payload.actions[0].action_id + '+' + incoming_cmd;
  } else if (req_payload.actions[0].type == "static_select"){
    incoming_cmd = req_payload.actions[0].selected_option.value;
    action_log = "static_select-" + incoming_cmd;
  }
  if(incoming_cmd ==  "no-action"){
    return;
  }
  answer = respondToCommand(incoming_cmd);

  const log_line = privateLogLine(req_payload.trigger_id, req_payload.channel.name,
    req_payload.user.name, req_payload.type, action_log , req_type);
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
  console.log("Started on PORT " + port);
})
