const command_infrastructure = require('./commands');
const cmd_list_prefix = command_infrastructure.cmd_list_prefix
const cmd_list_alias_pre = command_infrastructure.cmd_list_alias_pre
const cmd_list_alias_sep = command_infrastructure.cmd_list_alias_sep
const cmd_list_alias_post = command_infrastructure.cmd_list_alias_post

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

const privateLogLine = function (trigger_id, channel, user_name, payload_type, 
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


module.exports.PrepareSpecialAnswers = PrepareSpecialAnswers
module.exports.privateLogLine = privateLogLine
