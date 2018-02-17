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
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.send(new builder.Message()
                    .address(message.address)
                    .text("Oi Tudo bem!  Eu sou o assistente virtual da SideJob"));
            }
        });
    }
});

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
        if(results.response.entity=="Sim"){
        	 session.send("Ótimo você tem linkedin." ); 
             session.send(session.userData.name + ", você está sendo redirecionado para a página de login do Linkedin." );        	         	 
             //Basic root dialog which send a changeBackground event. No NLP, regex, validation here - just grabs input and sends it back as an event. 
             var reply = createEvent("linkedinConnec", session.userData, session.message.address);
             session.endDialog(reply);
        }else{
        	session.send(session.userData.name + ", infelizmente você tem que criar uma conta no linkedin (http://www.linkedin.com) para prosseguir.");
        	session.endDialog();
        }
        
    }
]);

//Creates a backchannel event
const createEvent = (eventName, value, address) => {
    var msg = new builder.Message().address(address);
    msg.data.type = "event";
    msg.data.name = eventName;
    msg.data.value = value;
    return msg;
}
