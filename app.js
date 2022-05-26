// *************************************************************************************
// *  이름: app.js
// *
// *  설명:
// *
// *  참고: 1. 이 노드 프로젝트는 vue와 express서버를 하나의 단일서버에서 기동시키는 것을
// *           전제로 소스가 짜여져 있다. (2022.05.23)
// *
// *        2. require문을 import로 바꾸었는데, 바꾸는게 가능하려면 node 버전13 이상에
// *           package.json에 type을 module로 설정해주어야 한다. (2022.05.24)
// *
// *
// *************************************************************************************

// ***********************************************************************
// *  1. 각종 모듈들을 불러온다.
// ***********************************************************************

// node_modules의 express 모듈 불러오기
// const express = require("express");
import express from "express";

// http 모듈 불러오기(node.js 기본 내장 모듈)
// const http = require("http");
import http from "http";

// 설치한 socket.io 모듈 불러오기
// const socket = require("socket.io");
import { Server } from "socket.io";

// 특정 폴더의 파일들을 특정 패스로 접근할 수 있도록 열어주는 역할
// const serveStatic = require("serve-static");

// const path = require("path");
import path from "path";
const __dirname = path.resolve();

// const cookieParser = require("cookie-parser");
import cookieParser from "cookie-parser";

// const expressSession = require("express-session");
import expressSession from "express-session";

// post 방식 파서
// const bodyParser_post = require("body-parser");
import bodyParser_post from "body-parser";

// vue router와 express router 연동 시 새로고침 대응을 위해 사용하는 모듈이다.
// const history = require("connect-history-api-fallback");
import history from "connect-history-api-fallback";

// 세션을 mysql db에 저장하기 위해
import mysqlsession from "express-mysql-session";

import indexRouter from "./routes/index.js";
import awsDbConfig from "./common/const.js";

// ***********************************************************************
// *  2. express 객체 생성
// ***********************************************************************
const app = express();

// ***********************************************************************
// *  3. 미들웨어 로직 실행 처리
// ***********************************************************************
// (참고) app.use 의 기능?
//   ->  미들웨어를 로드하여 해당 로직이 실행되게하는 기능을 한다.

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

// 세션을 mysql db에 저장하기 위해 해당 모듈을 불러온다.
// const MySQLSessionStore = require("express-mysql-session")(expressSession);
const MySQLSessionStore = mysqlsession(expressSession);
const sessionStore = new MySQLSessionStore(awsDbConfig);
app.use(
  expressSession({
    key: "my session key",
    // secret 프로퍼티에는 키값을 넣어준다.
    secret: "my secret key",
    // mysql db 에 세션을 저장한다.
    store: sessionStore,
    // resave가 true이면 기존 세션이 변경사항이 없어도 매 리퀘스트마다 세션을 다시 저장한다.
    resave: false,
    // saveUninitialized가 true이면 매 요청시마다 아무 내용이 없는 세션이 계속해서 저장된다.
    saveUninitialized: false,
    // 세션 쿠키 설정 (세션 관리 시 클라이언트에 보내는 쿠키)
    cookie: {
      httpOnly: false,
      secure: false,
    },
  })
);

// ***********************************************************************
// *  4. 라우터 관련 미들웨어 로직 실행처리
// ***********************************************************************

// CORS 설정
// 임시. 주석해제
// app.all("/*", (req, res, next) => {
//   console.log(">>>>>>>>>>>>>>>>>>>>>  app.js  151");

//   res.header("Access-Control-Allow-Origin", "*");
//   // res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   res.header("Access-Control-Allow-Headers", "*");
//   next();
// });

console.log(">>>>>>>>>>>>>>>>>>>>>  app.js  123");

// 아래 두줄이 없다면
// http://서버주소/css 로 접근하면 접근이 거부된다.
// 아래 두 줄을 넣어줌으로써
// 실행되는 서버 코드 기준 디렉토리의 static 폴더 내 css 폴더를
// 외부 클라이언트들이 /css 경로로 접근할 수 있다.
// js도 마찬가지이다.
// app.use('/css', express.static('./static/css'))
// app.use('/js', express.static('./static/js'))

// const staticFile = express.static(path.join(__dirname + '/dist'));

// 아래의 (1) ~ (4) 까지는 vue router와 express router 연동을 위한 로직들이다.

// -------------------------------------------------------------------
// 아래 두줄은 노드의 라우터를 타지 않고 /public/index.html의 라우트를 타도록 해준다.
// (1)
const staticFile = express.static(path.join(__dirname + "/public"));
// (2)
app.use(staticFile);
// -------------------------------------------------------------------

// join은 __dirname(현재 .js 파일의 path) 와 public 을 합친다.
// 이렇게 경로를 세팅하면 public 폴더 안에 있는 것을 곧바로 쓸 수 있게 된다.
// app.use(serveStatic(path.join(__dirname, 'public')))

// -------------------------------------------------------------------
// 이 블록의 소스들은 새로고침시에도 오류없이 기능이 정상동작하도록 처리해주는 부분이다.

// 아래 (3) 부분의 위아래로 app.use(staticFile);를 넣어줘야 라우팅기능이 모두 정상 동작한다.
// (3)
app.use(
  history({
    disableDotRule: true,
    verbose: true,
  })
);
// (4)
app.use(staticFile);

app.use("/", indexRouter);

// -------------------------------------------------------------------

// ***********************************************************************
// *  5. 웹소켓 관련 설정을 한다.
// ***********************************************************************
// express http 서버 생성
const server = http.createServer(app);

// 생성된 서버를 socket.io에 바인딩
const socketio = new Server(server);

// on은 수신, emit은 전송이다.
// 접속되면 아래의 콜백함수가 실행된다.
//   -> 매개변수로 전달된 아래의 socket은 접속된 소켓이다.
socketio.sockets.on("connection", function(socket) {
  /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
  socket.on("newUser", function(name) {
    console.log(name + " 님이 접속하였습니다.");

    /* 소켓에 이름 저장해두기 */
    socket.name = name;

    /* 모든 소켓에게 전송 */
    socketio.sockets.emit("update", {
      type: "connect",
      name: "SERVER",
      msg: name + "님이 접속하였습니다.",
    });
  });

  /* 전송한 메시지 받기 */
  socket.on("message33", function(data) {
    /* 받은 데이터에 누가 보냈는지 이름을 추가 */
    data.name = socket.name;

    console.log(data);

    /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit("update", data);
  });

  /* 접속 종료 */
  socket.on("disconnect", function() {
    console.log(socket.name + "님이 나가셨습니다.");

    /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit("update", {
      type: "disconnect",
      name: "SERVER",
      msg: socket.name + "님이 나가셨습니다.",
    });
  });
});

// ***********************************************************************
// *  6. 나머지 기타 설정, 기능 등을 정의한다.
// ***********************************************************************
// 환경변수에서 port를 가져온다. 환경변수가 없을시 5050포트를 지정한다.
const port = process.env.PORT || 5050;

// express 서버를 실행할 때 필요한 포트 정의 및 실행 시 callback 함수를 받습니다
app.listen(port, () => {
  console.log("start! express server");
});
