const commands_infrastructure = require('./commands')
const answers_infrastructure = require('./answers')
const request = require('request')

module.exports = function(app) {

    app.get('/',function(req,res){
        res.send('Welcome to the slackbot "community" for [data against covid-19](https://app.slack.com/client/TUQTGE7FU)')
    })

    // Responds to messages sent by user
    app.post('/',function(req,res){
        req_type = 'slash_command'
        answer = commands_infrastructure.respondToCommand(req.body.text)
        // A bit of console logging of the request
        console.log(answers_infrastructure.privateLogLine(
            req.body.trigger_id, req.body.channel_name, req.body.user_name,
            req.body.command , req.body.text ,req_type))
        res.send(answer)
    })

    // Responds to interactive commands
    // Following block format:
    // https://api.slack.com/interactivity/handling
    app.post('/response',function(req,res){
        res.sendStatus(200) // First send the acknowledgement
        req_type = 'user_interaction'

        // Parse the payload, aka the bit of interest
        req_payload = JSON.parse(req.body.payload)
        // Extract the interaction value, which must match a command
        let incoming_cmd = ""
        let action_log = ""
        if(req_payload.actions[0].type == "button"){
            incoming_cmd = req_payload.actions[0].value
            action_log = req_payload.actions[0].action_id + '+' + incoming_cmd
        } else if (req_payload.actions[0].type == "static_select"){
            incoming_cmd = req_payload.actions[0].selected_option.value
            action_log = "static_select-" + incoming_cmd
        }
        if(incoming_cmd ==  "no-action"){
            return
        }
        answer = commands_infrastructure.respondToCommand(incoming_cmd)

        const log_line = answers_infrastructure.privateLogLine(
            req_payload.trigger_id, req_payload.channel.name,
            req_payload.user.name, req_payload.type, action_log , req_type)
        console.log(log_line)

        answer.text  = "Answering : " + log_line // Add detail of question
        answer.replace_original= false
        request.post({ 
            headers: {'content-type' : 'application/json'}, 
            url: req_payload.response_url,
            body: JSON.stringify(answer)
        }, function(error, response, body){}) 

    })

}

