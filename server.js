import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 8000;

const connection_uri = 'mongodb+srv://admin:admin@cluster0.wfqwd.mongodb.net/chatdb?retryWrites=true&w=majority'
const pusher = new Pusher({
    appId: "1103870",
    key: "ca6ea51aa3cef8b24a2b",
    secret: "08295c6d5c0e80b5d058",
    cluster: "ap2",
    useTLS: true
  });
  
  pusher.trigger("my-channel", "my-event", {
    message: "hello world"
  });


app.use(express.json());
app.use(cors());
// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();
// });
mongoose.connect(connection_uri,{
    useCreateIndex: true,
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(console.log('Database connected'));
const db = mongoose.connection;
db.once("open", ()=>{
    const messageCollection = db.collection('messages');
    const changeStream = messageCollection.watch();

    changeStream.on('change',(change)=>{
        console.log('A change was made', change);
        if(change.operationType==='insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        }
        else{
            console.log('Error triggering the pusher');
        }
    })
})
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync',(req,res)=>{
Messages.find((err,data)=>{
    if(err){
        res.sendStatus(500).send(err);
    }
    else{
        console.log(data);
        res.send(data);
    }
});
});
app.post('/messages/new', (req,res)=>{
const dbMessage = req.body;
Messages.create(dbMessage,(err,data)=>{
    if(err){
        res.status(500).send(err);
    }
    else{
        res.status(201).send(data);
    }
})
});
app.listen(port, ()=>console.log(`listening at port ${port}`));