const express = require("express")
const bodyParser = require("body-parser")
const request = require('request')
const favicon = require('serve-favicon')
const path = require('path')
const crypto = require('crypto')

const app = express()

const command_infrastructure = require('./commands')
const command_map = command_infrastructure.command_map
const commandsFromFolder = command_infrastructure.commandsFromFolder
const generateCommandHelp = command_infrastructure.generateCommandHelp
const respondToCommand = command_infrastructure.respondToCommand
const cmd_list_prefix = command_infrastructure.cmd_list_prefix
const cmd_list_alias_pre = command_infrastructure.cmd_list_alias_pre
const cmd_list_alias_sep = command_infrastructure.cmd_list_alias_sep
const cmd_list_alias_post = command_infrastructure.cmd_list_alias_post
const commands =  command_infrastructure.commands

const answer_infrastructure = require('./answers')
const PrepareSpecialAnswers = answer_infrastructure.PrepareSpecialAnswers
const privateLogLine = answer_infrastructure.privateLogLine

// ============================
/// Preprocessing
// ============================

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Collect valid commands from commands.json and messages/commands/ folder 
// and messages/commands_hidden
// Parse commands in folders
const command_lists = {}
commandsFromFolder('./messages/commands_prioritaires/', commands, command_map)
command_lists["aide"] = generateCommandHelp(commands, command_map)
commandsFromFolder('./messages/commands/', commands, command_map)
command_lists["documentation"] = generateCommandHelp(commands, command_map)
commandsFromFolder('./messages/commands_hidden/', commands, command_map)
command_lists["doc-dev"] = generateCommandHelp(commands, command_map)

PrepareSpecialAnswers(command_lists, commands, command_map)

console.log(command_map)
console.log(command_lists)

// ============================
/// Event handling
// ============================

require('./router')(app)

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT " + port)
})
