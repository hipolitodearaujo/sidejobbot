/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

//Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

//Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

bot.use(builder.Middleware.dialogVersion({ version: 0.2, resetCommand: /^reset/i }));

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

bot.set('storage', tableStorage);

//Bot listening for inbound backchannel events - in this case it only listens for events named "buttonClicked"
//bot.on("event", function (event) {
//    var msg = new builder.Message().address(event.address);
//    msg.textLocale("en-us");
//    if (event.name === "buttonClicked") {
//        msg.text("I see that you just pushed that button");
//    }
//    bot.send(msg);
//})


bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Tudo bem... Qual o seu nome?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Oi " + results.response + ", qual a sua idade?"); 
    },
    function (session, results) {
        session.userData.age = results.response;
        builder.Prompts.number(session, session.userData.name + ", qual a quantidade de horas que você pode disponibilizar para um plano B?"); 
    },
    function (session, results) {
        session.userData.hours = results.response;
        builder.Prompts.choice(session, "Você tem linkedin?", ["Sim", "Não"]);
    },
    function (session, results) {
        session.userData.islinkedin = results.response.entity;
        if(results.response.entity="Sim"){
        	 session.send("Ótimo você tem linkedin." );
        }else{
        	session.send("Infelizmente você tem que criar uma conta no linkedin (http://www.linkedin.com) para prosseguir." + results.response.entity);
        }
        
      //Basic root dialog which send a changeBackground event. No NLP, regex, validation here - just grabs input and sends it back as an event. 
        var reply = createEvent("changeBackground", session.message.text, session.message.address);
        session.endDialog(reply);
        
//        session.send("Muito bem... " + session.userData.name + 
//                    " você tem " + session.userData.age + 
//                    " de idade, e tem disponibilidade de trabalhar em um plano B por " + session.userData.hours + " horas." );
    }
]);
