const fs = require("fs");

const commands = {}; // simple text commands
const cmd_list_prefix = ' :arrow_right:  ';
const cmd_list_alias_pre = ' (aka: ';
const cmd_list_alias_sep = ';';
const cmd_list_alias_post = ')';

const generateCommandHelp = function (commands, command_map) {
  // Generates markdown text with the name of the commands 
  // and their known aliases.
  let command_list = "";
  for (const key in commands) {
    command_list += cmd_list_prefix + key;
    for (let i=1; i<command_map["cmd_to_alias"][key].length; i++){
      if (i==1){
        command_list += cmd_list_alias_pre;
      }
      command_list += command_map["cmd_to_alias"][key][i]
      if (i==command_map["cmd_to_alias"][key].length-1){
        command_list += cmd_list_alias_post;
      } else {
        command_list += cmd_list_alias_sep;
      }
    }
    command_list += "\n";
  }
  return command_list;
}

const command_map = {
    "alias_to_cmd": {},
    "cmd_to_alias": {},
    // TODO: make command_map an object
    "add_key": function(key, phrase) {
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

function parseAndMapCommand(command_file, commands, command_map){
  // Only act on valid command JSON files as defined by needing a 
    // "command" and an "answer" field
    const check_properties = ("command" in command_file) && ("answer" in command_file);
    if(!check_properties){
      console.log(item + "does not contain a valid command object, make sure fields"
        + "'command'(Array|String) and 'answer' are defined");
      return;
    }

    // Now we have a valid command file lets process it
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

const commandsFromFolder = function(command_directory, commands, command_map) {
  // Explores all json files in a directory and looks for files matching the 
  // command format of objects with fields "command" and "answer"

  const command_files = fs.readdirSync(command_directory);
  for(i=0; i<command_files.length; i++) {
    item = command_files[i];
    // Only act on JSON files otherwise continue (skip rest of loop)
    if(item.slice(-5).toLowerCase() != ".json"){
      console.log(item + " is not a .json file, skipping");
      continue;
    }
    
    command_file = require(command_directory + "/" + item);
    if (Array.isArray(command_file)){
      command_file.forEach(function (command_item, _){
        parseAndMapCommand(command_item, commands, command_map);
      });
    } else {
      parseAndMapCommand(command_file, commands, command_map)
    }
  }
}

const respondToCommand = function(incoming_cmd) {
  // Respond to a command that was received.
  let answer = ""
  if (incoming_cmd == "") {
      answer = require('./messages/_.json');
  } else if (command_map["alias_to_cmd"][incoming_cmd.toLowerCase()]) {
      answer = commands[command_map["alias_to_cmd"][incoming_cmd.toLowerCase()]];
  } else {
      answer = require('./messages/unknown_command_error.json');
  }
  return answer;
}

module.exports.command_map = command_map;
module.exports.commandsFromFolder = commandsFromFolder;
module.exports.cmd_list_prefix = cmd_list_prefix
module.exports.cmd_list_alias_pre = cmd_list_alias_pre
module.exports.cmd_list_alias_sep = cmd_list_alias_sep
module.exports.cmd_list_alias_post = cmd_list_alias_post
module.exports.generateCommandHelp = generateCommandHelp
module.exports.respondToCommand = respondToCommand
module.exports.commands = commands
