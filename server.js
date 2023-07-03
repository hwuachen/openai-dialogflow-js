const express = require("express");
const dialogflow = require("@google-cloud/dialogflow");
const { WebhookClient, Payload } = require("dialogflow-fulfillment");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  //console out request path and method
  console.log(`Path: ${req.path} Method: ${req.method}`);
  // res.header('Access-Control-Allow-Origin', '*');
  next();
});


app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: "./",
  });
});

// app.get('/test', (req, res) => {
//     res.send('Hello World! This is a chatbot server.')
//     res.sendStatus(200);
// })

require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
// console.log('API KEY = ' + configuration.apiKey);
const textGeneration = async (prompt) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      //prompt: prompt,
      prompt: `Human: ${prompt}\nAI: `,
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["\n", " Human:", " AI:"]
    });
   
    console.log("textGeneration prompt = " + prompt);
    console.log("textGeneration Response Data:", response.data);
    // console.log("textGeneration Status Code:", response.status);
    console.log("textGeneration text:", response.data.choices[0].text);
    return { 
      status: 1, 
      response: response.data.choices[0].text};
  } catch (error) {
    return { status: 0, response: error.message };
  }
};

// Create a Dialogflow CX session client
const SessionsClient = new dialogflow.SessionsClient();

app.post("/test", function (req, res, next) {
  const agent = new WebhookClient({ request: req, response: res });
  console.log(`intent => test`);
  console.log("request = ", req.body);
  console.log("response = ", res.body); 
  agent.add(`Hello, test complete`);
});

app.post("/dialogflow", (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });
  console.log(`intent => dialogflow`);
  console.log("dialogflow request = ", req.body);
  const id = res.req.body.session.substr(41);
  console.log("dialogflow id = " + id);
  console.log("dialogflow action =", req.body.queryResult.action);
  console.log("dialogflow queryText =", req.body.queryResult.queryText);

  const hi = (agent) => {
    console.log(`intent => hi`);
    agent.add(
      `Hello, I am your personal excellent AI assistant. How can I help you?`
    );
  };

  const WebhookTest = (agent) => {
    console.log(`intent => WebhookTest`);
    agent.add(`Hello, WebhookTest complete`);
  };

  async function fallback(agent) {
    let action = req.body.queryResult.action;
    let queryText = req.body.queryResult.queryText;
    console.log(`intent => fallback`);
    console.log("queryText = " + queryText);

    if (action === "input.unknown") {
      console.log(`intent => fallback input.unknown`);
      let result = await textGeneration(queryText);
      console.log("result.status" + " " + result.status);
      console.log("result.response" + " " + result.response);
      if (result.status == 1) {
        agent.add(result.response);
      } else {
        agent.add("I'm sorry, I didn't understand that. Could you try again?");
      }
    }
  }

  const intentMap = new Map();
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("Default Welcome Intent", hi);
  intentMap.set("WebhookTest", WebhookTest);
  agent.handleRequest(intentMap);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is up and running at http://localhost:${port}/`);
});
