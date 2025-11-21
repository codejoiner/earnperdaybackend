const mysql=require('mysql2')
const dotenv =require('dotenv')

dotenv.config()
const fs=require('fs')

const conn=mysql.createPool({
   host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    port:process.env.DB_PORT,
    
   
    waitForConnections:true,
    connectionLimit:10,
    connectTimeout:5000, 
    queueLimit:0,
    

    enableKeepAlive: true, 
    keepAliveInitialDelay: 0,
    ssl:{
        rejectUnauthorized:true,

       ca:fs.readFileSync('./sslsec/ca.pem')
    },

    typeCast:function(field,next){
        if(field.type==='DATE'){
            return field.string()
        }
        return next()
    }
})



conn.on('error',(err)=>{
    console.log('connection Error',err)
})






module.exports=conn



