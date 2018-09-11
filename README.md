# 가상화폐 알림봇 웹서버

## 소개

가상화폐거래소 시세를 대략 매초마다 수신하여 원하는 시세 조건에 대해 알람메세지를 보냅니다.

홈페이지 : http://p2pcbot.com:3000/

텔레그램 아이디 : [p2pcoinbot](https://telegram.me/p2pcbot)

## 가상화폐 알림봇 

소스 저장소 : https://github.com/SDRLurker/p2pcbot

## 의존성 관리

```
~/p2pcbot2$ npm install
```

## DB설정

```
~/p2pcbot2$ vi route/config.js
var config = {};
config.mysql = {
  connectionLimit : 100,
  host            : 'DB주소',
  user            : 'DB사용자',
  password        : 'DB비밀번호',
  database        : 'DB명'
}
module.exports = config;
```
