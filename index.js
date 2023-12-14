const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');

var app = express();

app.use(express.static('public'));
app.set('view engine','ejs');

app.listen(2434);
//localhost:2434
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret:"secret"}))

const con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"node_project_9em"
})


//======================functions=======================
function isProductInCart(cart, id){
    for(let i=0; i<cart.length; i++){
        if(cart[i].id ==id){
            return true;
        }
    }

    return false;
}

function calculateTotal(cart, req){
    var total = 0.0;
    for(let i=0; i<cart.length; i++){
        if(cart[i].sale_price){
            total = total + Number(cart[i].sale_price);
        }else{
            total = total + Number(cart[i].price);
        }
    }
    req.session.total = total.toFixed(2);
    return total;
}

//===================start=============================
app.get('/',function(req, res){
    const compraConcluida = req.query.compraConcluida === 'true';
    const produtoRepetido = req.query.produtoRepetido === 'true';
    const adicionadoCarrinho = req.query.adicionadoCarrinho === 'true';

    con.query("SELECT * FROM produtos", function(err,result){

        res.render('pages/index',{
            result:result, 
            compraConcluida:compraConcluida,
            produtoRepetido:produtoRepetido, 
            adicionadoCarrinho:adicionadoCarrinho});
    })

});

app.post('/add_to_cart', function(req,res){

    if (!req.session.usuario) {
        res.redirect('/login');
        return;
    }

    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var image = req.body.image;

    var product = {
        id:id,
        name:name,
        price:price,
        sale_price:sale_price,
        image:image
    };

    if(req.session.cart){
        var cart = req.session.cart;

        if(!isProductInCart(cart, id)){
            cart.push(product);
        }

    } else {
        req.session.cart = [product];
        var cart = req.session.cart;
    }

    //calcular total da compra
    calculateTotal(cart, req);

    //confirmação
    res.redirect('/?adicionadoCarrinho=true');

});

app.get('/cart', function(req,res){

    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/carrinho',{cart:cart,total:total});

});

app.post('/remove_product', function(req,res){

    var id = req.body.id;
    var cart = req.session.cart;

    for(let i=0; i<cart.length; i++){
        if(cart[i].id == id){
            cart.splice(cart.indexOf(i),1);
        }
    }

    //recalcular o valor total
    calculateTotal(cart,req);

    if(cart.length == 0){
        res.redirect('/');
    } else {
        res.redirect('/cart');
    }
});

app.post('/checkout', function(req,res){

    const userId = req.session.usuario.id;
    const cart = req.session.cart;
    let jogos_ids = req.session.usuario.jogos_ids ? JSON.parse(req.session.usuario.jogos_ids) : [];
    let jogos_total = req.session.usuario.jogos_total;
    let jogosAdicionados = 0;

    console.log(jogos_ids + "jogos que ja tinham");
    const jogosIdsSet = new Set(jogos_ids);
    console.log(jogosIdsSet);

    for (let i = 0; i < cart.length; i++) {
        const jogoId = cart[i].id;
        if (!jogosIdsSet.has(jogoId)) {
            jogosIdsSet.add(jogoId);
            jogos_total++;
            jogosAdicionados++;
        }
    }

    jogos_ids = Array.from(jogosIdsSet);
    

    console.log(jogos_ids);
    console.log(jogosAdicionados);

    if (jogosAdicionados > 0) {
        const query = 'UPDATE cadastros SET jogos_total = ?, jogos_ids = ? WHERE id = ?';
        con.query(query, [jogos_total, JSON.stringify(jogos_ids), userId], function(err, results) {
            if (err) {
                console.error('Erro ao atualizar informações do usuário:', err);
                res.status(500).json({ message: 'Erro ao atualizar informações do usuário' });
                return;
            }
    
            // Limpar carrinho após a conclusão da compra
            req.session.cart = [];
    
            res.redirect('/?compraConcluida=true');
        });
    } else {
        // Se nenhum jogo foi adicionado, redirecione sem fazer o update
        req.session.cart = [];
        res.redirect('/?produtoRepetido=true');
    }

    

});


app.get('/login', function(req, res) {
    const cadastroSucesso = req.query.cadastroSucesso === 'true';

    if (req.session.usuario) {
        const id = req.session.usuario.id;
        res.redirect(`/perfil/${id}`);
        return;
      }
  
    res.render('pages/login', { cadastroSucesso:cadastroSucesso });
  });

app.post('/logar', function(req, res) {
const { login, senha } = req.body;

const query = 'SELECT * FROM cadastros WHERE login = ? AND senha = ?';
con.query(query, [login, senha], (err, results) => {
    if (err) {
        console.error('Erro ao autenticar usuário:', err);
        res.status(500).send('Erro ao autenticar usuário');
        return;
    }

    if (results.length > 0) {
        // Usuário autenticado com sucesso
        req.session.usuario = results[0];
        const id = req.session.usuario.id;
        res.redirect(`/perfil/${id}`);

    } else {
        // Credenciais inválidas
        res.send('Credenciais inválidas');
    }
});

});

app.get('/perfil/:id', function(req,res){
    const userId = req.params.id;

    if (!req.session.usuario) {
        res.redirect('/login');
        return;
    }

    const query = 'SELECT * FROM cadastros WHERE id = ?';
    con.query(query, [userId], function(err, results) {
        if (err) {
            console.error('Erro ao obter informações do usuário:', err);
            res.status(500).send('Erro ao obter informações do usuário');
            return;
        }

        if (results.length > 0) {
            const usuario = results[0];
            res.render('pages/perfil', { usuario });
        } else {
            res.status(404).send('Usuário não encontrado');
        }
    });
});

app.get('/cadastro', function(req,res){
    res.render('pages/cadastro');
});

app.post('/cadastrar', function(req,res){


    const { 
        login, 
        senha } = req.body;

    const jogos_ids = [];
    const jogos_total = 0;

    const query = 'INSERT INTO cadastros (login, senha, jogos_total, jogos_ids) VALUES (?, ?, ?, ?)';
    con.query(query, [login, senha, jogos_total, JSON.stringify(jogos_ids)], function(err, results) {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            res.status(500).send('Erro ao cadastrar usuário');
            return;
        }
        res.redirect('/login?cadastroSucesso=true');
    });



});

app.get('/logout', function(req, res) {
    // Limpar a sessão
    req.session.destroy(function(err) {
      if (err) {
        console.error('Erro ao realizar logout:', err);
        res.status(500).send('Erro ao realizar logout');
        return;
      }
  
      // Redirecionar para a página de login após o logout
      res.redirect('/login');
    });
  });

  app.get('/biblioteca', function(req, res) {
    const userId = req.session.usuario.id;

    const query = 'SELECT jogos_ids FROM cadastros WHERE id = ?';
    con.query(query, [userId], function(err, results) {
        if (err) {
            console.error('Erro ao recuperar IDs dos jogos:', err);
            res.status(500).json({ message: 'Erro ao recuperar IDs dos jogos' });
            return;
        }

        const jogosIds = results[0].jogos_ids ? JSON.parse(results[0].jogos_ids) : [];

        if (jogosIds.length === 0) {
            res.render('pages/biblioteca', { jogos: [] });
            return;
        }

        const queryProdutos = 'SELECT * FROM produtos WHERE id IN (?)';
        con.query(queryProdutos, [jogosIds], function(errProdutos, resultadosProdutos) {
            if (errProdutos) {
                console.error('Erro ao recuperar informações dos jogos:', errProdutos);
                res.status(500).json({ message: 'Erro ao recuperar informações dos jogos' });
                return;
            }

            res.render('pages/biblioteca', { jogos: resultadosProdutos });
        });
    });
});