const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;
const api = require("./routes/index");
const cors = require('cors');

app.use(cors());
//api 미들웨어 등록
app.use('/api', api);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database: conf.database
});

connection.connect();

app.get('/', (req, res) => {
    connection.query("select * from users", (err, rows, fields) => {
        res.send(rows);
    });
});

app.post('/api/users/register', (req, res) => {
    // 회원 가입 할때 필요한 정보들을 client에서 가져오면
    // 그것들을 데이터 베이스에 넣어준다.
    
    
   let sql="insert into users values(?,?,?,?)";
    let userName=req.body.name;
    let userPw=req.body.password;
    let userAddr= req.body.address;
    let userEmail=req.body.email;

    let params=[userName,userPw,userAddr,userEmail];
    connection.query(sql,params,(err,rows,fields)=>{
        if(err) res.json({success:false, err})
        return res.status(200).json({
            success:true
        })
    })

    
    });


app.listen(port, () => console.log(`서버 가동 포트번호: ${port}`));

app.post('/api/users/login', (req, res)=>{

    let sql="select * from users where userName=? and userPw=?";
    let userEmail=req.body.email;
    let userPw=req.body.password;

    let params=[userEmail,userPw];
    connection.query(sql, params,(err,rows,fields)=>{
        console.log("test");
        console.log(rows);
        console.log(err);
        
        if(err) res.json({loginSuccess:false, err})
        return res.status(200).json({
            loginSuccess:true
        })
    })
})