
const conn=require('../conn/dbconn')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
require('dotenv').config()

const Join = async (req, res) => {
  const { Realname, username, phone, password, cpassword, initialRefferalCode } = req.body;
    
  try {
    
    if (!Realname || !username || !phone || !password) {
      return res.status(400).json({ message: "Field required, check all fields" });
    }



    
    const [existingUser] = await conn
      .promise()
      .query("SELECT * FROM users WHERE Username=? OR Phone=?", [username, phone]);

      
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Account already exists" });
    }

  
    const generate_random_id = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const Random_id = generate_random_id(1, 10000000);

   
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const [userResult] = await conn
      .promise()
      .query(
        "INSERT INTO users (userid, Realname, Username, Phone, Password, invitors_id) VALUES (?, ?, ?, ?, ?, ?)",
        [Random_id, Realname, username, phone, hashedPassword, initialRefferalCode]
      );

   
    if (userResult.affectedRows === 1) {
      return res.status(200).json({
        congratmessage: "Congratulations! You have successfully joined. Tap to login.",
      });
    } else {
      return res.status(500).json({ message: "Failed to join. Retry." });
    }

  } catch (error) {
   console.error("Error in Transaction Controller:", error.message);
        return res.status(500).json({ message: "Server error fetching transactions." });
  }
};





const Login=async (req,res)=>{
    try{
    const {username,password}=req.body;
    
    if(!username| !password){
      return res.status(400).json({message:'Username and Password required!'})

    }
    else{
      const check_login_credentials="SELECT * FROM `users` WHERE Username=?"
       conn.query(check_login_credentials,[username],async function(err,response){
          if(err){
            
            return res.status(500).json({message:"Login failed"})
            
          }
          if(response.length==0){
             return res.status(401).json({message:"Login not allowed check your credentials!!"})
          }
          if(response.length==1){
             const user=response[0]
   
             const compared_password=await bcrypt.compare(password,user.Password)
             if(!compared_password){
              return res.status(401).json({message:"Login not allowed check your credentials!"})
             }else{
              if(compared_password){
                 req.session.Current_userId=user.userid
                req.session.username=user.Username
                req.session.Role=user.Role
                req.session.realname=user.Realname

                  req.session.save((err)=>{
                    
                  if(err) return res.status(500).json({message:" SERVER ERROR"})
                  
                 }) 
                 
                     
                   const token= jwt.sign({id:user.userid,Role:user.Role,username:user.username},process.env.JWT_SECRET,{expiresIn:'2h'})
                   if(token){

                    return res.status(201).json({uToken:token,UserID:req.session.Current_userId})
                   }
             }
             }
             
            
          }

        
       })
    }
          



    }
    catch(error){
          console.error("Error in during Login", error.message);
        return res.status(500).json({ message: "Login failed try again!" });

    }
}

let getUserName= async(req,res)=>{
   try{
     if(req.session.username&& req.session.Role){
       return res.status(200).json({username:req.session.username,role:req.session.Role})
     }

   }
    catch(error){
      console.error("Error in get username controller", error.message);
        return res.status(500).json({ message: "Error in to get username controller" });
    }
}




module.exports={
    Join,Login,getUserName
  }