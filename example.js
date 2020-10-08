var mysql = require('mysql');
var fs = require('fs');
var qr = require('qr-image');  
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

console.log(process.env.DATABASE_HOST)
console.log(typeof(process.env.DATABASE_HOST))

var con = mysql.createConnection({
  host: process.env.DATABASE_HOST || '127.0.0.1',
  user: "root",
  password: "owez1997"
});

var app = express()
app.use(cors())

app.use(bodyParser.json({extended: false, limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false }));

console.log("hiiiiiiiiii")

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to db");
  con.query("CREATE DATABASE IF NOT EXISTS school", function (err, result) {
    if (err) throw err;
    
    con.query("USE school", function (err, result) {
      if (err) throw err;
      
      var sql = "CREATE TABLE IF NOT EXISTS data (name VARCHAR(255), login VARCHAR(20), password VARCHAR(20))";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table data created");
      });  
      
      sql = "CREATE TABLE IF NOT EXISTS class (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(20), teacher VARCHAR(50))";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table class created");
      });   
  
      sql = "CREATE TABLE IF NOT EXISTS student (id INT PRIMARY KEY AUTO_INCREMENT, class_id int, name VARCHAR(50), tel_home VARCHAR(12), tel_mother VARCHAR(12), tel_father VARCHAR(12))";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table student created");
      });   

      sql = "CREATE TABLE IF NOT EXISTS days (id INT PRIMARY KEY AUTO_INCREMENT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, stud_id INT)";
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table student created");
      });   

    });

  });

  app.get("/generate-qr", (req, res)=>{
    var code = qr.image('http://blog.nodejitsu.com', { type: 'svg' });  
    var output = fs.createWriteStream('./qrgen/nodejitsu.svg')

    code.pipe(output);  
  })

  app.post("/save-school", (req, res)=>{
    var obj = req.body
    var sql = "INSERT INTO data (name, login, password) VALUES ('"+obj.school+"', '"+obj.login+"', '"+obj.password+"')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/edit-school", (req, res)=>{
    var obj = req.body
    var sql = "UPDATE data SET name = '"+obj.school_new+"', login = '"+obj.login_new+"' , password = '"+obj.password_new+"' WHERE login = '"+obj.login+"' AND  password = '"+obj.password+"'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })
  
  app.post("/login", (req, res)=>{
    var obj = req.body
    var sql = "SELECT name FROM data WHERE login='"+obj.login+"' AND password='"+obj.password+"'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (result.length)
        res.send(result[0].name)
      else
        res.send("error")
    });
  })

  app.post("/new-class", (req, res)=>{
    var obj = req.body
    var sql = "INSERT INTO class (name, teacher) VALUES ('"+obj.name+"', '"+obj.teacher+"')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/update-class", (req, res)=>{
    var obj = req.body
    var sql = "UPDATE class SET "+obj.name+" = '"+obj.val+"' WHERE id = "+obj.id;
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/remove-class", (req, res)=>{
    var obj = req.body
    var sql = "DELETE FROM class WHERE id IN "+obj.ids;
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.get("/get-classes", (req, res)=>{
    var sql = "SELECT class.id, class.name, class.teacher, (SELECT COUNT(id) FROM student WHERE student.class_id=class.id) as cnt FROM class";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  })

  app.post("/new-stud", (req, res)=>{
    var obj = req.body
    var sql = "INSERT INTO student (name, class_id, tel_home, tel_mother, tel_father) VALUES ('"+obj.name+"', '"+obj.class_id+"', '"+obj.tel_home+"', '"+obj.tel_mother+"', '"+obj.tel_father+"')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/update-stud", (req, res)=>{
    var obj = req.body
    var sql = "UPDATE student SET name = '"+obj.name+"', tel_home = '"+obj.tel_home+"', tel_mother = '"+obj.tel_mother+"', tel_father = '"+obj.tel_father+"' WHERE id = "+obj.id;
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/remove-stud", (req, res)=>{
    var obj = req.body
    var sql = "DELETE FROM student WHERE id IN "+obj.ids;
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/get-class-stud", (req, res)=>{
    var obj = req.body
    var sql = "SELECT * FROM student WHERE class_id="+obj.class_id;
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  })

  app.post("/new-days", (req, res)=>{
    var obj = req.body;
    var day = obj.day;
    var month = new Date().getMonth()+1;
    var year = new Date().getFullYear();  
    var hour = new Date().getHours();  
    var min = new Date().getMinutes();  
    var ts = year+"-"+month+"-"+day+" "+hour+":"+min;
    var sql1 = "SELECT stud_id, created FROM days WHERE stud_id="+obj.id+" AND YEAR(created)="+year+" AND MONTH(created)="+month+" AND DAY(created)="+day;
    con.query(sql1, function (err, result) {
      if (result.length>0){
        res.send("Success")        
      }
      else{
        var sql = "INSERT INTO days (stud_id, created) VALUES ('"+obj.id+"', '"+ts+"')";
        con.query(sql, function (err, result) {
          if (err) throw err;
          res.send("Success")
        });
      }
    });
  })

  app.post("/remove-days", (req, res)=>{
    var obj = req.body
    var sql = "DELETE FROM days WHERE stud_id = "+obj.id+" AND DAY(created) = "+obj.day+" AND MONTH(created) = MONTH(CURRENT_DATE()) AND YEAR(created) = YEAR(CURRENT_DATE())";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send("Success")
    });
  })

  app.post("/get-month-days", (req, res)=>{
    var obj = req.body
    console.log(obj)
    var sql = "SELECT student.id, DAY(days.created) AS day FROM student join days on student.id=days.stud_id WHERE student.class_id="+obj.class_id+" AND MONTH(days.created) = "+obj.month+" AND YEAR(days.created) = YEAR(CURRENT_DATE())";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  })  

  app.post("/get-today", (req, res)=>{
    var obj = req.body
    console.log(obj)
    var sql = "select student.id, student.name, student.tel_home, student.tel_mother, student.tel_father, class.name as clas, class.teacher as teacher from student join class on class.id=student.class_id where student.id not in (select stud_id from days where DAY(days.created) = "+obj.day+" AND MONTH(days.created) = "+obj.month+" AND YEAR(days.created) = YEAR(CURRENT_DATE())) order by class.name asc";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  }) 

  app.post("/get-todays-late", (req, res)=>{
    var obj = req.body
    console.log(obj)
    var sql = "select student.id, student.name, student.tel_home, student.tel_mother, student.tel_father, class.name as clas, class.teacher as teacher, days.created as date from days join student on days.stud_id=student.id join class on class.id=student.class_id having DAY(days.created) = "+obj.day+" AND MONTH(days.created) = "+obj.month+" AND YEAR(days.created) = YEAR(CURRENT_DATE()) AND ( (HOUR(days.created)=8 AND MINUTE(days.created)>20) OR HOUR(days.created)>8 )"
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  })  
  
  app.get("/get-students", (req, res)=>{
    var sql = "select student.id, student.name, class.name as clas from student join class on class.id=student.class_id order by class.name asc";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  })  

  app.post("/get-students-by-class", (req, res)=>{
    var obj = req.body
    var sql = "select student.id, student.name, class.name as clas from student join class on class.id=student.class_id where student.class_id='"+obj.id+"' order by class.name asc";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result)
    });
  })  

  // app.listen(8080, ()=>console.log("server is running port: 8080"));
  app.listen(8081, ()=>console.log("server is running port: 8081"));

});
