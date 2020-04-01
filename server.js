const express = require("express")
const bodyParser = require("body-parser")
const favicon = require('serve-favicon')
const path = require('path')

const app = express()

const command_infrastructure = require(path.join(__dirname, 'core', 'commands'))
const command_map = command_infrastructure.command_map
const commandsFromFolder = command_infrastructure.commandsFromFolder
const generateCommandHelp = command_infrastructure.generateCommandHelp
const commands =  command_infrastructure.commands

const answer_infrastructure = require(path.join(__dirname, 'core', 'answers'))
const PrepareSpecialAnswers = answer_infrastructure.PrepareSpecialAnswers

// ============================
/// Preprocessing
// ============================

app.use(favicon(path.join(__dirname, 'core','public', 'favicon.ico')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Collect valid commands from commands.json and messages/commands/ folder 
// and messages/commands_hidden
// Parse commands in folders
const command_lists = {}
const cmd_folder_priority = path.join(__dirname, 'core', 'messages', 'commands_prioritaires')
const cmd_folder = path.join(__dirname, 'core', 'messages', 'commands')
const cmd_folder_hidden = path.join(__dirname, 'core', 'messages', 'commands_hidden')
commandsFromFolder(cmd_folder_priority, commands, command_map)
command_lists["aide"] = generateCommandHelp(commands, command_map)
commandsFromFolder(cmd_folder, commands, command_map)
command_lists["documentation"] = generateCommandHelp(commands, command_map)
commandsFromFolder(cmd_folder_hidden, commands, command_map)
command_lists["doc-dev"] = generateCommandHelp(commands, command_map)

PrepareSpecialAnswers(command_lists, commands, command_map)

console.log(command_map)
console.log(command_lists)

// ============================
/// Event handling
// ============================

require(path.join(__dirname, 'core', 'router'))(app)

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT " + port)
})
