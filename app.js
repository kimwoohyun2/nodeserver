// *************************************************************
// *  1. 각종 모듈들을 불러온다.
// *************************************************************

// file system 모듈 불러오기(node.js 기본 내장 모듈)
//   -> 파일과 관련된 처리를 하는 모듈이다
const fs = require('fs')

// node_modules의 express 모듈 불러오기
const express = require('express')

// mysql 모듈 불러오기
const mysql = require('mysql')

// 설치한 socket.io 모듈 불러오기
const socket = require('socket.io')

// http 모듈 불러오기(node.js 기본 내장 모듈)
const http = require('http')

// 특정 폴더의 파일들을 특정 패스로 접근할 수 있도록 열어주는 역할
const serveStatic = require('serve-static')

const path = require('path')

const cookieParser = require('cookie-parser')

const expressSession = require('express-session')

// post 방식 파서
const bodyParser_post = require('body-parser')

// 세션을 mysql db에 저장하기 위해 해당 모듈을 불러온다.
const MySQLStore = require("express-mysql-session")(expressSession);


// *************************************************************
// *  2. express 객체 생성
// *************************************************************
const app = express()


// *************************************************************
// *  3. 세션을 저장할 mysql db 접속 설정 및 접속
// *************************************************************
const options = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "vmfhvmfh1!",
  database: "session_test",
};

const sessionStore = new MySQLStore(options);

const connection = mysql.createConnection(options);
  
connection.connect();
  


// *************************************************************
// *  4. 미들웨어들 등록 시작, 아래 미들웨어들은 내부적으로 next() 가 실행됨
// *************************************************************
// app.use 메소드는 원하는 미들웨어를 추가할때 사용한다.
// 아래 두줄이 없다면
// http://서버주소/css 로 접근하면 접근이 거부된다.
// 아래 두 줄을 넣어줌으로써
// 실행되는 서버 코드 기준 디렉토리의 static 폴더 내 css 폴더를
// 외부 클라이언트들이 /css 경로로 접근할 수 있다.
// js도 마찬가지이다.
app.use('/css', express.static('./static/css'))
app.use('/js', express.static('./static/js'))

// join은 __dirname(현재 .js 파일의 path) 와 public 을 합친다.
// 이렇게 경로를 세팅하면 public 폴더 안에 있는 것을 곧바로 쓸 수 있게 된다.
app.use(serveStatic(path.join(__dirname, 'public')))

// post 방식 일경우 (begin)
// post 의 방식은 url 에 추가하는 방식이 아니고 body 라는 곳에 추가하여 전송하는 방식
// post 방식 세팅
app.use(bodyParser_post.urlencoded({ extended: false }));
// json 사용 하는 경우의 세팅
app.use(bodyParser_post.json());
// post 방식 일경우 (end)

// 아래와 같이 cookieParser를 미들웨어로 등록하면
// request 객체에 cookies 속성이 추가된다.
app.use(cookieParser());

// 세션 환경 세팅
// 세션은 서버쪽에 저장하는 것을 말하는데, 
// 파일로 저장 할 수도 있고 
// 레디스라고 하는 메모리DB등 다양한 저장소에 저장 할 수도 있다.
app.use(expressSession({
  key: 'my session key',
  // secret 프로퍼티에는 키값을 넣어준다.
  secret: 'my secret key',
  // mysql db 에 세션을 저장한다.
  store: sessionStore,
  // resave가 true이면 기존 세션이 변경사항이 없어도 매 리퀘스트마다 세션을 다시 저장한다.
  resave: false,
  // saveUninitialized가 true이면 매 요청시마다 아무 내용이 없는 세션이 계속해서 저장된다.
  saveUninitialized: false,
  //세션 쿠키 설정 (세션 관리 시 클라이언트에 보내는 쿠키)
  cookie: {
    httpOnly: false,
    secure: false,
  },
}));


// *************************************************************
// *  5. 라우터 등록
// *************************************************************

// CORS 설정
app.all('/*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});


// 회원가입
app.route('/signup').post(
  // 설정된 쿠키정보를 본다.
  (req, res) => {

    const paramID = req.body.id || req.query.id;
    const pw = req.body.pw || req.query.pw;

    console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  134');
    console.log(req.body);

    connection.query('SELECT * FROM session WHERE id=?', [paramID], (error, results, fields) => {
      if (error) {
        console.log(error);

        return;
      }

      console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  143');
      console.log(results);
      console.log(fields);

      if (results.length > 0) {
        console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  153');
        console.log('이미 로그인 되어 있음');
        console.log(paramID);
        console.log(pw);

  
        // res.writeHead(100, { "Content-Type": "application/json" });
        res.json({ msg: '이미 존재하는 아이디입니다' });
        // res.end();
  
      } else {
        console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  165');
        console.log('no login');
        console.log(paramID);
        console.log(pw);
  
  
        // session을 어디에 저장할 것 인가?
        // 세션은 보통 db, redis, file 등에 저장한다.
        // session은 서버 메모리(MemoryStore)에 저장된다.
        // 서버가 중단되면 세션은 모두 초기화 된다.
        // 따라서 세션을 다른 서버 저장소에 저장할 필요가 있다.
        // 보통 Redis를 사용하여 저장한다.
        // 다른 방법으로는 session-file-store 모듈을 사용하여
        // FileStore 저장하거나,
        // express-mysql-session 모듈을 사용하여
        // DB에 저장하는 방법이 있다.
        // 간단한 구현을 위해 FileStore에 저장하여 구현해본다.
  
        // 로그인 화면에서 로그인하여 세션이 만들어지면
        // 서버가 응답을 보낼때 세션값을 쿠키형태로 클라이언트에 보내준다.
        // 이 쿠키가 바로 connect.sid 이고 브라우저에 저장된다.
        // connect.sid 쿠키는 웹 브라우저에서 세션 정보를 저장할 때 만들어진 것이다.
        // 브라우저마다 이름이 다를 수 있지만
        // 쿠키를 사용해 세션 정보를 저장하는 방식은 같다.
  
        // req.session.save(err => {
        //   console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  202');
        //   if (err) {
        //     console.log(err);
        //     return res.status(500).send("<h1>500 error</h1>");
        //   }
        // });
  
        connection.query('INSERT INTO session SET?',
          { id: paramID, pw: pw },
          (error, results, fields) => {
          if (error) {
            console.log(error);
            res.json({ msg: '회원가입 실패', flag: 2 });
            return;
          }
    
          console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  216');
          console.log(results);

          res.json({ msg: '회원가입 성공', flag: 1 });

          // res.redirect("/");
        });
  
        // db 커넥션 종료 처리
        connection.end();
      }
    });
  }
);


app.route('/login2').post(
  // 설정된 쿠키정보를 본다.
  (req, res) => {

    const paramID = req.body.id || req.query.id;
    const pw = req.body.pw || req.query.pw;

    console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  225');
    console.log(req.body);

    connection.query('SELECT * FROM session WHERE id=?', [paramID], (error, results, fields) => {
      if (error) {
        console.log(error);

        // db 커넥션 종료 처리
        connection.end();

        return;
      }

      console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  238');
      console.log(results);
      console.log(fields);

      if (results.length > 0) {
        console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  243');
        console.log('이미 로그인 되어 있음');
        console.dir(results[0].pw);

        if (pw == results[0].pw) {
          res.json({ msg: '로그인 완료', flag: 3 });
        } else {
          res.json({ msg: '비밀번호가 틀립니다.', flag: 4 });
        }
  
      } else {
        // db 커넥션 종료 처리
        connection.end();
  
        // res.redirect("/");
  
        res.json({ msg: '존재하지 않는 아이디입니다', flag: 5 });
  
        console.log('>>>>>>>>>>>>>>>>>>>>>  app.js  261');
      }
    });
  }
);

// http://localhost:3000/process/product 이 주소로 치면 라우터를 통해 바로 여기로 올 수 있다
app.route('/process/product').get(
  function (req, res)
  {
    console.log('/process/product  라우팅 함수 실행');

    // 세션정보는 req.session 에 들어 있다
    if (req.session.user)
    {
      // 세션에 유저가 있다면

      res.redirect('/product.html');
    }
    else
    {
      res.redirect('/login2.html');
    }
  }
);
 
 
app.route('/process/logout').get(
  // 설정된 쿠키정보를 본다.
  function (req, res) {
    console.log('/process/loginout 라우팅 함수호출 됨');

    if (req.session.user) {
      console.log('로그아웃 처리');

      // 세션 삭제.
      req.session.destroy(
        function (err) {
          if (err) {
            console.log('세션 삭제시 에러');
            return;
          }
          console.log('세션 삭제 성공');
          // 파일 지정시 제일 앞에 / 를 붙여야 root 즉 public 안에서부터 찾게 된다
          res.redirect('/Login2.html');
        }
      );          // 세션정보 삭제

    } else {
      console.log('로긴 안되어 있음');
      res.redirect('/Login2.html');
    }
  }
);


// 아래는 vue 연동부분이다.
// express의 라우터로 접근시 public/index.html이 전달되도록 설정한다.
app.get('/', (req, res) => {
  // fs.readFile('./static/index.html', (err, data) => {
  //   if (err) {
  //     res.send('에러')
  //   } else {
  //     res.writeHead(200, {'Content-Type':'text/html'})
  //     // write 메소드를 통해 응답할 경우 꼭 end 메소드를 써줘야한다.
  //     res.write(data)
  //     // 모두 보냈으면 완료되었음을 알린다.
  //     res.end()
  //   }
  // })
  res.sendFile(path.join(__dirname, '../public', 'index.html'))
})

// *************************************************************
// *  6. 웹소켓 관련 설정을 한다.
// *************************************************************
// express http 서버 생성
const server = http.createServer(app)

// 생성된 서버를 socket.io에 바인딩
const socketio = socket(server)

// on은 수신, emit은 전송이다.
// 접속되면 아래의 콜백함수가 실행된다.
//   -> 매개변수로 전달된 아래의 socket은 접속된 소켓이다.
socketio.sockets.on('connection', function(socket) {

  /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
  socket.on('newUser', function(name) {
    console.log(name + ' 님이 접속하였습니다.')

    /* 소켓에 이름 저장해두기 */
    socket.name = name

    /* 모든 소켓에게 전송 */
    socketio.sockets.emit('update', {type: 'connect', name: 'SERVER', msg: name + '님이 접속하였습니다.'})
  })

  /* 전송한 메시지 받기 */
  socket.on('message33', function(data) {
    /* 받은 데이터에 누가 보냈는지 이름을 추가 */
    data.name = socket.name
    
    console.log(data)

    /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', data);
  })

  /* 접속 종료 */
  socket.on('disconnect', function() {
    console.log(socket.name + '님이 나가셨습니다.')

    /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', msg: socket.name + '님이 나가셨습니다.'});
  })
})

// *************************************************************
// *  7. 나머지 기타 설정, 기능 등을 정의한다.
// *************************************************************
// 환경변수에서 port를 가져온다. 환경변수가 없을시 5050포트를 지정한다.
const port = process.env.PORT || 5050

// express 서버를 실행할 때 필요한 포트 정의 및 실행 시 callback 함수를 받습니다
app.listen(port, () => {
  console.log('start! express server');
})
