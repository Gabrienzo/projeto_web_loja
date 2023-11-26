const express = require("express");
const app = express();

/* app.get("/", function(req, res){
    res.sendFile(__dirname + "/html/index.html");
});

app.get("/sobre", function(req, res){
    res.send("sobreeeeeeeeeeee");
});

app.get("/ola/:cargo/:nome/:cor", function(req, res){
    res.send("<h1>Ola " + req.params.nome + "</h1>"+
    "<h2>Soube que você é " + req.params.cargo + "</h2>"+
    "<p color: blue>E gosta da cor " + req.params.cor + "</p>");
}); */



app.listen(8081, function(){
    console.log("Servidor rodando na url http://localhost:8081");
});
//localhost:8081