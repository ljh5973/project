const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;
const api = require("./routes/index");
const cors = require('cors');

const {google} = require("googleapis");
var googleClient =require('./config/google.json');

const googleConfig
={
    clientId:googleClient.web.client_id,
    clientSecret:googleClient.web.client_secret,
    redirect:googleClient.web.redirect_uris[0]
}

const scopes = [
    'https://www.googleapis.com/auth/plus.me'
  ];
   
   
  const oauth2Client =new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirect
  );

//   google + api 를 사용하기 위해 google+ api 에 대한 정보 입력

const url = oauth2Client.generateAuthUrl({
    access_type:'offline',
    scope:scopes
});
function getGooglePlusApi(auth){
    return google.plus({version:'v1',auth});
}

// 실질적으로 로그인해서 정보를 불러올 코드 작성
// 리프레시토큰 엑세스토큰 displayName과 id를 얻어와본다.
async function googleLogin(code){
    const{tokens}=await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    oauth2Client.on('tokens', (token)=>{
        if(token.refresh_token){
            console.log("리프레시 토큰 : ",tokens.refresh_token);
        }
        console.log("액세스 토큰 : ", tokens.access_token);
    });
    const plus =getGooglePlusApi(oauth2Client);
    const res=await plus.people.get({userId:'me'});
    console.log(`Hello ${res.data.displayName}! ${res.data.id}`);
    return res.data.displayName;
}

app.get('/googleLogin', function(req,res){
    res.redirect(url);
});

app.get("/auth/google/callback", async function(req,res){
    const displayName=await googleLogin(req.query.code);
    console.log(displayName);

    res.redirect("http://localhost:3000");
});
  
  
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

    let sql="select * from users where userEmail=? and userPw=?";
    let userEmail=req.body.email;
    let userPw=req.body.password;

    let params=[userEmail,userPw];
    console.log(params);
    connection.query(sql, params,(err,rows,fields)=>{
        console.log("test");
        console.log(rows);
        console.log(err);
        
        if(rows!=null) res.json({loginSuccess:true})
        return res.status(200).json({
            loginSuccess:false
        })
    })
})