

const express=require('express')
const app=express()
 const cors=require('cors')
const session=require('express-session')
const cookie_parser =require( 'cookie-parser')
bodyParser=require('body-parser')
const conn=require('../dbconn/dbconn.js')
const ratelimit= require('express-rate-limit')

const userRoutes=require('../routes/approutes.js')

const {TrackerDailyEarn}=require('../controllers/logical.controllers.js')
 
const Cron=require('node-cron')

const morgan= require('morgan')


require('dotenv').config()
const port=process.env.PORT


app.use(express.json())
app.use(cors({
    origin:['http://localhost:5173'],
    methods:['GET','POST','DELETE','PATCH','PUT'],
    credentials:true

}))

app.use(express.urlencoded({extended:true}))
 app.use(cookie_parser())
 app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        secure:false,
        httpOnly:true,
        sameSite:'lax',
        maxAge:1000*60*60*24*365
        
    }
 }))
app.listen(port,(err)=>{
    if(!err){
        console.log(`server running`)
    }
})



app.use(morgan('dev'))

app.use('/',userRoutes)




Cron.schedule("0 0 * * *",async()=>{
     await TrackerDailyEarn()
},{
    timezone:'Africa/Kigali'
})




