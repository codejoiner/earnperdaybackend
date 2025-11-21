
const jwt=require ('jsonwebtoken')
const {body,validationResult}=require('express-validator')
require('dotenv').config()



 const VerifyToken=(roles=[])=>{
    
           return (req,res,next)=>{
            const token=req.headers.authorization?.split(" ")[1]
                   
             if(!token){
              return res.status(401).json({message:"Permission Denied"})
             }
            try{
            
              let verifiedUser=jwt.verify(token,process.env.JWT_SECRET)
                           
              req.user=verifiedUser;
               next()

            }
            catch(err){
              return res.status(403).json({message:"Invalid Token!"})
            }
           
    }
    }





 const allowedRole=(...allowedRoles)=>{
        return (req,res,next)=>{
           
              if(!req.user || !req.user.Role){
                return res.status(401).json({message:"Permission Denied!"})
              }
               const userRole=req.user.Role
              if(allowedRoles.includes(userRole)){
              
                next()
              }
              else{
                return res.status(403).json({message:"Permission Denied!"})
              }
        }


 }

module.exports={
    VerifyToken,
     allowedRole,
   

}





   
