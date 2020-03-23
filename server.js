var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.end('Welcome to the slackbot "community" for [data against covid-19](https://app.slack.com/client/TUQTGE7FU)')
});

app.post('/',function(req,res){

  let answer = ""
  let commands = require('./commands.json');
  let aide = "Ce service vous aidera à orienter correctement votre action sur ce slack.\nVous pouvez poser certaines questions à ce robot et ce dernier vous aidera à obtenir la bonne réponse.\nPour obtenir la liste des questions que vous pouvez poser, utilisez la commande 'aide' de cette manière : \n```/community aide```"

  if (req.body.text == "") {
      answer = aide
  } else if (req.body.text.toLowerCase() == "aide") {
      answer = "*Bienvenue sur Community*, le robot d'aide à l'action du slack *Data Against Covid-19*\n"
      answer += "Merci d'être ici, nous avons besoin de vous!\n\n"
      answer += "Pour poser une question à ce robot, utilisez la syntax suivante : ```/community [Ma Question]```\n"
      answer += "*Questions que vous pourriez posez :*\n"
      for (let key in commands) {
        answer += '- ' + key + '\n'
      }
      answer += "\nPar exemple : ```/community je veux proposer mon aide```"
      answer += "*La liste des questions va s'accroitre de manière régulière jusqu'à pouvoir vous aider dans tous les aspects de votre participation.*"
  } else if (commands[req.body.text.toLowerCase()]) {
      answer = commands[req.body.text.toLowerCase()]
  } else {
      answer = 'Commande inconnue. Utilisez la commande ```/community aide``` pour plus d\'information.'
  }

  res.end(answer)

});

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT 8000");
})
