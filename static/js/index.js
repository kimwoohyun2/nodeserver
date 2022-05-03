// io() 는 socket.io에서 제공하는 함수이다.
const socket = io()

// 접속 되었을 때 실행
socket.on('connect', function() {
  // 이름을 입력받고
  const name = prompt('반갑습니다!', '')

  // 이름이 빈칸인 경우
  if (!name) {
    name = '익명'
  }

  // 서버에 새로운 유자가 왔다고 알림
  socket.emit('newUser', name)
})

socket.on('update', (data) => {
  console.log(`${data.name}: ${data.msg}`)
})

// 전송 함수
function send() {
  // 입력되어있는 데이터 가져오기
  const message = document.getElementById('test').value
  
  // 가져왔으니 데이터 빈칸으로 변경
  document.getElementById('test').value = ''

  // on은 수신, emit은 전송이다.
  // 서버로 send 이벤트 전달 + 데이터와 함께
  // (참고) message33이라는 이름의 이벤트를 전송했으면 받는곳에서는 on('message33') 가 있어야 받을 수 있다.
  socket.emit('message33', {msg: message})
}
