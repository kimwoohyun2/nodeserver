// 개인aws에 있는 db주소이니 ip주소가 유동적으로 계속 변하는 것을
// 염두에 둘 것.
const awsDbConfig = {
  host: "13.209.35.93",
  port: 3306,
  user: "test",
  password: "test",
  database: "session_test",
};

export default awsDbConfig;
