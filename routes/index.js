// *************************************************************************************
// *  이름: routes/index.js
// *
// *  설명:
// *
// *  참고: 1. 이 노드 프로젝트는 vue와 express서버를 하나의 단일서버에서 기동시키는 것을
// *           전제로 소스가 짜여져 있다. (2022.05.23)
// *
// *        2. require문을 import로 바꾸었는데, 바꾸는게 가능하려면 node 버전13 이상에
// *           package.json에 type을 module로 설정해주어야 한다. (2022.05.24)
// *
// *        3. "/" 경로에 대한 라우팅이 없는 이유는
// *           app.js의 express.static(path.join(__dirname + "/public")); <- 이 부분에서
// *           노드의 라우터를 타지 않고 /public/index.html 즉, vue의 라우터를 타도록
// *           해놨기 때문에 없는 것이다. (2022.05.25)
// *
// *
// *
// *************************************************************************************

// const express = require("express");
import express from "express";
// mysql2 모듈 불러오기
// mysql모듈을 쓰지 않고 mysql2 모듈을 쓰는 이유
//   -> node.js 와 mysql8가 caching_sha2_password을 사용하지 못해서
//      오류가 생기기 때문이다.
// const mysql = require("mysql2");
import mysql from "mysql2";
import awsDbConfig from "../common/const.js";
// jwt 처리(생성,검증)를 편하게 할 수 있도록 도와준다.
import jsonwebtoken from "jsonwebtoken";

const router = express.Router();

// ***************************************************************************
// *  1. 세션을 저장할 mysql db 접속
// ***************************************************************************
const connection = mysql.createConnection(awsDbConfig);
connection.connect();

// ***************************************************************************
// *  2. 라우팅 기능 처리
// ***************************************************************************

// router.get("/", async (req, res) => {
//   res.sendFile(path.join(__dirname, "./public/index.html"));
// });
// ----------------------------------------------------------------------
//  경로: /api/prod
//  설명: 임시
// ----------------------------------------------------------------------
router.get(
  "/api/prod",
  // 설정된 쿠키정보를 본다.
  async (req, res) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  56");
    // console.log(req);

    // await new Promise((resolve) => setTimeout(resolve, 3000));

    res.json({ msg: "임시 메시지", flag: 1 });
  }
);

// ----------------------------------------------------------------------
//  경로: /api/logincheck
//  설명: 로그인 인증 체크
// ----------------------------------------------------------------------
router.get("/api/logincheck", (req, res) => {
  // 인증 확인
  const token = req.headers.authorization;
  let secret_key = "woohyun";

  console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  76");
  console.log(req.headers);
  console.log(token);

  if (!token) {
    res.status(400).json({
      status: 400,
      msg: "Token 없음",
    });

    return;
  }

  console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  84");

  const checkToken = new Promise((resolve, reject) => {
    jsonwebtoken.verify(token, secret_key, function(err, decoded) {
      if (err) reject(err);
      resolve(decoded);
    });
  });

  console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  94");

  checkToken
    .then((token) => {
      console.log(token);
      res.status(200).json({
        status: 200,
        msg: "로그인 인증 완료",
        token,
      });
    })
    .catch(() => {
      res.status(401).json({
        status: 401,
        msg: "로그인 상태가 아닙니다.",
        token,
      });
    });
});

// ----------------------------------------------------------------------
//  경로: /api/login2
//  설명: 로그인 처리
// ----------------------------------------------------------------------
router.post(
  "/api/login2",
  // 설정된 쿠키정보를 본다.
  (req, res) => {
    const paramID = req.body.id || req.query.id;
    const pw = req.body.pw || req.query.pw;

    let secret_key = "woohyun";

    console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  76");
    console.log(req.body);

    if (!paramID) {
      res.json({ status: 400, msg: "ID가 입력되지 않았습니다.", flag: 6 });
      return;
    }

    if (!pw) {
      res.json({
        status: 400,
        msg: "비밀번호가 입력되지 않았습니다.",
        flag: 7,
      });
      return;
    }

    try {
      connection.query(
        `SELECT * FROM USER WHERE id='${paramID}'`,
        (error, results, fields) => {
          // db select 중에 오류가 난 경우
          if (error) {
            console.log(error);
            res.status(500).json({
              status: 500,
              msg: "오류가 발생했습니다.",
              flag: 98,
            });

            return;
          }

          // db select 결과 매칭되는 데이터가 없는 경우
          if (results.length <= 0) {
            // res.redirect("/");

            res.status(400).json({
              status: 400,
              msg: "존재하지 않는 아이디입니다",
              flag: 5,
            });

            return;
          }

          // 현재는 비번암호화가 되어있지 않으므로 주석처리한다. (2022.05.31)
          // const hash = crypto
          //   .createHmac("sha256", secret)
          //   .update(pw)
          //   .digest("base64");

          // if (hash !== results[0].pw) {
          // 사용자가 입력한 비번과 db에 저장된 비번이 다른 경우
          if (pw !== results[0].pw) {
            res.json({ status: 400, msg: "비밀번호가 틀립니다.", flag: 4 });
            return;
          }

          // 사용자가 입력한 비번과 db에 저장된 비번이 같은 경우
          if (pw === results[0].pw) {
            // res.json({ msg: "로그인 완료", flag: 3 });
            const getToken = new Promise((resolve, reject) => {
              // 여기서 jwt를 생성한다.
              jsonwebtoken.sign(
                {
                  id: results[0].id,
                  // role: results[0].role,
                },
                secret_key,
                {
                  expiresIn: "7d",
                  issuer: "woohyun",
                  subject: "userInfo",
                },
                (err, token) => {
                  // 아래와 같이 reject를 호출하면 실패상태가 된다.
                  if (err) reject(err);
                  // 아래와 같이 resolve를 호출하면 이행완료상태가 된다.
                  resolve(token);
                }
              );
            });

            getToken.then((token) => {
              res.status(200).json({
                status: 200,
                msg: "로그인 완료",
                flag: 3,
                token,
              });
            });
          }
        }
      );
    } catch (err) {
      res.json({ msg: "오류가 발생하여 정상처리되지 못하였습니다.", flag: 99 });
    } finally {
      // db 커넥션 종료 처리
      // connection.end();
    }
  }
);

// ----------------------------------------------------------------------
//  경로: /signup
//  설명: 회원가입
// ----------------------------------------------------------------------
router.post(
  "/signup",
  // app.route('/signup').post(
  // 설정된 쿠키정보를 본다.
  (req, res) => {
    const paramID = req.body.id || req.query.id;
    const pw = req.body.pw || req.query.pw;
    const role = req.body.role || req.query.role;

    console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  132");
    console.log(req.body);

    try {
      connection.query(
        "SELECT * FROM USER WHERE id=?",
        [paramID],
        (error, results, fields) => {
          if (error) {
            console.log(error);

            return;
          }

          if (results.length > 0) {
            console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  150");
            console.log("이미 가입되어 있는 아이디가 있습니다.");
            console.log(paramID);
            console.log(pw);

            // res.writeHead(100, { "Content-Type": "application/json" });
            res.json({ msg: "이미 가입되어 있는 아이디가 있습니다." });
            // res.end();
          } else {
            console.log(">>>>>>>>>>>>>>>>>>>>>  routes/index.js  159");
            console.log("no login");
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

            connection.query(
              "INSERT INTO USER SET?",
              { id: paramID, pw: pw, role: role },
              (error, results, fields) => {
                if (error) {
                  console.log(error);
                  res.json({ msg: "회원가입 실패", flag: 2 });
                  return;
                }

                res.json({ msg: "회원가입 성공", flag: 1 });

                // res.redirect("/");
              }
            );
          }
        }
      );
    } catch (err) {
      res.status(500).json({
        status: 500,
        msg: "오류가 발생하여 정상처리되지 못하였습니다.",
        flag: 99,
      });
    } finally {
      // db 커넥션 종료 처리
      // connection.end();
    }
  }
);

export default router;
