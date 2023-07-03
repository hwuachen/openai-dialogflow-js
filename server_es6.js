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

// app.get('/', (req, res) => {
//     res.send('Hello World! This is a chatbot server.')
//     res.sendStatus(200);
// })
app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: "./",
  });
});

// Create a Dialogflow CX session client
const SessionsClient = new dialogflow.SessionsClient();
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
// console.log('API KEY = ' + configuration.apiKey);
const openai = new OpenAIApi(configuration);

const textGeneration = (prompt) => {
  return new Promise((resolve, reject) => {
    openai
      .createCompletion({
        model: "text-davinci-003",
        prompt: `Human: ${prompt}\nAI: `,
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: ["\n", " Human:", " AI:"],
      })
      .then((response) => {
        resolve({ status: 1, response: response.data.choices[0].text });
      })
      .catch((error) => {
        reject({ status: 0, response: error.message });
      });
  });
};

app.post("/test", function (req, res, next) {
  console.log("request = ", req.body);
  console.log("response = ", res.body);
});

app.post("/dialogflow", (req, res) => {
  console.log("dialogflow is called");
  console.log("request = ", req.body);
  // const { queryInput, session } = req.body;
  const id = res.req.body.session.substr(41);
  console.log("id = " + id);
  console.log("action =", req.body.queryResult.action);
  console.log("queryText =", req.body.queryResult.queryText);

  const agent = new WebhookClient({ request: req, response: res });

  const fallback = (agent) => {
    const action = req.body.queryResult.action;
    const queryText = req.body.queryResult.queryText;

    console.log("queryText = " + queryText);

    if (action === "input.unknown") {
      console.log(`intent => fallback input.unknown`);
      textGeneration(queryText)
        .then((result) => {
          console.log("result.status" + " " + result.status);
          console.log("result.response" + " " + result.response);
          if (result.status === 1) {
            agent.add(result.response);
          } else {
            agent.add(
              "I'm sorry, I didn't understand that. Could you try again?"
            );
          }
        })
        .catch((error) => {
          console.error(error);
          agent.add(
            "I'm sorry, an error occurred while processing your request."
          );
        });
    }
  };

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

  const GPTTest = (agent) => {
    console.log(`intent => GPTTest`);

    queryText = "What is the difference between openai and BART?";

    textGeneration(queryText)
      .then((result) => {
        console.log("result.status" + " " + result.status);
        console.log("result.response" + " " + result.response);
        if (result.status === 1) {
          agent.add(result.response);
        } else {
          agent.add(
            "I'm sorry, I didn't understand that. Could you try again?"
          );
        }
      })
      .catch((error) => {
        console.error(error);
        agent.add(
          "I'm sorry, an error occurred while processing your request."
        );
      });
  };

  const intentMap = new Map();
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("Default Welcome Intent", hi);
  intentMap.set("WebhookTest", WebhookTest);
  intentMap.set("GPTTest", GPTTest);
  agent.handleRequest(intentMap);
});

// const textGeneration = async(prompt) => {
//     try {
//         const response = await openai.createCompletion({
//             model: "text-davinci-003",
//             prompt: prompt,
//             // prompt: `Human: ${prompt}\nAI: `,
//             temperature: 1,
//             max_tokens: 256,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//             // stop: ["\n", " Human:", " AI:"]
//           });

//         console.log('textGeneration prompt = '+ prompt);
//         console.log("textGeneration Response Data:", response.data);
//         console.log("textGeneration Status Code:", response.status);
//         console.log("textGeneration text:", response.data.choices[0].text);

//         return { status: 1, response: response.data.choices[0].text };
//     } catch (error) {
//         return { status: 0, response: error.message };
//     }
// };

//Handle incoming messages from Dialogflow CX
// app.post('/dialogflow', async (req, res) => {
//     // Get the session path from the request body
//     const { queryInput, session } = req.body;
//     var id = (res.req.body.session).substr(43);
//     console.log('id = ' + id);
//     console.log('request = ' + req.body);

//     const agent = new WebhookClient({ request: req, response: res });

//     async function fallback(agent) {
//         let action = req.body.queryResult.action;
//         let queryText = req.body.queryResult.queryText;

//         console.log('queryText = '+ queryText);

//         if (action === 'input.unknown')
//         {
//             console.log(`intent => fallback input.unknown`);
//             let result = await textGeneration(queryText);
//             console.log ('result.status' + " " + result.status)
//             console.log ('result.response' + " " + result.response)
//             if (result.status == 1) {
//                 agent.add(result.response);
//             } else {
//                 agent.add("I'm sorry, I didn't understand that. Could you try again?");
//             }
//         }
//     }

//     function hi (agent) {
//         console.log(`intent => hi`);
//         agent.add(`Hello, I am your personal excellent AI assistant. How can I help you?`);
//     }
//     let intentMap = new Map();
//     intentMap.set('Default Fallback Intent', fallback);
//     intentMap.set('Default Welcome Intent', hi);
//     agent.handleRequest(intentMap);
// });

// Start the server
app.listen(port, () => {
  console.log(`Server is up and running at http://localhost:${port}/`);
});
