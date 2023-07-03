# create default package.json
npm init -y
npm install ngrok
npm install express axios 
npm install openai
npm install --save dotenv 
npm install @google-cloud/dialogflow
npm install dialogflow-fulfillment


nodemon server.py

.\node_modules\ngrok\bin\ngrok http 5000