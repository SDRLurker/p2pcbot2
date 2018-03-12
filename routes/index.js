var express = require('express');
var router = express.Router();
var config = require('./config');

var mysql = require('mysql');
var pool  = mysql.createPool(config.mysql);

function add_msg(rows) {
  for(var i=0;i<rows.length;i++) {
    var row = rows[i];
    var msg = "";
    if( row.code === "%" )
      msg = row.currency + " 등락율 " + row.val + " 이상이하!";
    else if ( row.code === "cu" )
      msg = row.currency + " 종가 " + row.val + " 이상!";
    else if ( row.code === "cd" )
        msg = row.currency + " 종가 " + row.val + " 이하!";
    row.msg = msg;
  }
  return rows
}

function select_query(res, sql, arr) {
  pool.getConnection((err, conn) => {
    if(err) return res.send(err);
    conn.query(sql, arr, (err, rows) => {
      if(err) return res.send(err);
      conn.release();
      rows = add_msg(rows);
      console.log(rows);
      res.send(rows);
    });
  });
}

// get, http://localhost:3000/:id/conds
router.get('/:sessid/conds', (req, res, next) => {
  var sessid = req.params.sessid;
  var sql = "SELECT c.id, c.code, c.currency, c.val FROM member m, conditions c ";
  var arr = [sessid];
  sql += "WHERE m.sess_id=? AND NOW() <= sess_expire AND m.userid=c.userid"
  select_query(res, sql, arr);
});

function update_session_expire(sessid) {
  var sql = "UPDATE member SET sess_id=?, sess_expire = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE sess_id=?";
  var arr = [sessid, sessid];
  console.log(sql, arr);
  pool.getConnection((err, conn) => {
    if(err) throw err;
    conn.query(sql, arr, (err, rows) => {
      if(err) throw err;
      conn.release();
    });
  });
}

router.get('/:sessid', (req, res, next) => {
  var sessid = req.params.sessid;
  var sql = "SELECT userid FROM member WHERE sess_id=? AND NOW() <= sess_expire";
  var arr = [sessid];
  pool.getConnection((err, conn) => {
    if(err) throw err;
    conn.query(sql, arr, (err, rows) => {
      if(err) throw err;
      conn.release();
      console.log(rows);
      if(rows.length > 0) {
        update_session_expire(sessid);
        res.render('index', {'sess_id':sessid});
      }
      else
        res.send('해당 세션은 없거나 만기가 지났습니다.');
    });
  });
});

// post, http://localhost:3000/conds
router.post('/:sessid/conds', (req, res, next) => {
  var sessid = req.params.sessid;
  var currency = req.body.currency;
  var code = req.body.code;
  var val = req.body.val;
  var userid_sql = "(SELECT userid FROM member WHERE sess_id=? AND NOW() <= sess_expire)";
  var maxid_sql = "SELECT max(id+1) AS m, count(*) AS c FROM conditions WHERE userid=" + userid_sql;
  var arr = [sessid];
  var id = 0;
  // https://stackoverflow.com/questions/7972446/javascript-not-in-operator-for-checking-object-properties
  if(!('currency' in req.body) || !('code' in req.body) || !('val' in req.body)) {
    res.status(400).send({'error':'currency, code, 또는 val 값이 있어야 합니다!'});
    return;
  } else if (isNaN(val)) {
    res.status(400).send({'error':'val 값은 숫자여야 합니다!'});
    return;
  }
  pool.getConnection((err, conn) => {
    if(err) return res.send(err);
    conn.query(maxid_sql, arr, (err, rows) => {
      if(err) return res.send(err);
      conn.release();
      console.log(maxid_sql, arr, rows);
      if(rows.length != 1) {
        res.status(400).send({'error':'세션이 만기되었습니다.!'});
        return;
      }
      update_session_expire(sessid);
      id = rows[0]['m'];
      // [0]['c']에 따라 조건 개수 제약 기능.
      // console.log(id);
      if(rows[0]['c'] == 0)
        id = 1;

      var sql = "INSERT INTO conditions SET userid=" + userid_sql;
      sql = sql + ", id=" + id + ", currency=?, code=?, val=?";
      arr = [sessid, currency, code, val];
      console.log("post", sql, arr);
      pool.getConnection((err, conn) => {
        if(err) return res.send(err);
        conn.query(sql, arr, (err, result) => {
          if(err){
            rollback(err, conn);
            return res.send(err);
          }
          conn.commit(function (err) {
            if (err) {
              rollback(err, conn);
              return res.send(err);
            }// if err
          });
          conn.release();
          var sql = "SELECT c.id, c.code, c.currency, c.val FROM member m, conditions c ";
          var arr = [sessid];
          sql += "WHERE m.sess_id=? AND NOW() <= sess_expire AND m.userid=c.userid"
          select_query(res, sql, arr);
        });
      });
    });
  });
});

function rollback(err, conn){
  console.error(err);
  conn.rollback(function () {
    console.error('rollback error');
  });
}
// delete, http://localhost:3000/conds/삭제할번호
router.delete('/:sessid/conds/:no', (req, res, next) => {
  var sessid = req.params.sessid;
  var id = req.params.no;
  var sql = "delete from conditions where userid=(select userid from member where sess_id=?) and id=?";
  var arr = [sessid, id];
  if (isNaN(id)) {
    res.status(400).send({'error':'id값은 숫자여야 합니다!'});
    return;
  }
  pool.getConnection((err, conn) => {
    if(err) return res.send(err);
    conn.query(sql, arr, (err, result) => {
      if(err){
        rollback(err, conn);
        return res.send(err);
      }
      conn.commit(function (err) {
        if (err) {
          rollback(err, conn);
          return res.send(err);
        }// if err
      });
      conn.release();
      update_session_expire(sessid);
      var sql = "select c.id, c.code, c.currency, c.val from member m, conditions c where m.sess_id=? and m.userid=c.userid";
      var arr = [sessid];
      select_query(res, sql, arr);
    });
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('에러임!!');
  //res.render('index', { title: 'Express' });
});

module.exports = router;
