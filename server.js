var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',function(req,res){
  res.end('Welcome to the slackbot "community" for "data against covid-19" https://app.slack.com/client/TUQTGE7FU')
});

app.post('/',function(req,res){
  res.end(JSON.stringify(req.body))
});

port = process.env.PORT || 8000
app.listen(port,function(){
  console.log("Started on PORT 8000");
})
