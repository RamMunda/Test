// const config = require('config');
const mongoose = require("mongoose");
const express= require('express');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const RandomStrng = require('randomstring');
const emailExistence = require('email-existence');
const requestIp = require('request-ip');
var emailCheck = require('email-check');
require('dotenv').config();
// const storage = multer.diskStorage({
//   destination:function(req,file,cb){
//     cb(null,'./uploads/')
//   },
//    filename:function(req,file,cb){
//      cb(null,new Date().toDateString()+file.originalname)
//    }
// })
// const upload = multer({ storage:storage});
const upload = multer({ 
  dest:"./images"
});

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
// const session = require('express-session');
// const passport = require('passport');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
app.use(express.json());
// app.use(express.urlencoded({extended:true}));
app.use(fileUpload());
// Passport config
// require('./config/passport')(passport);
app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Request-Headers: accept, access-control-allow-origin, content-type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// if(!config.get('jwtprivatekey')){
//   console.log("FATAL Error : jwt private key is not define")
//   process.exit(1);
// }
mongoose.connect("mongodb://localhost/playground",{    
 useNewUrlParser: true,
 useUnifiedTopology: true })
.then(() => console.log("mongodb connected"))
.catch(err =>console.log("mongodb is not connected",err));
 

// mongoose.connect("mongodb+srv://rkm123:rkm123@cluster0.byw7c.mongodb.net/fbdata?retryWrites=true&w=majority",{    
//  useNewUrlParser: true,
//  useUnifiedTopology: true })
// .then(() => console.log("mongodb connected"))
// .catch(err =>console.log("mongodb is not connected",err));

// Express Session
// app.use(session({
//   secret: 'secret',
//   resave: true,
//   saveUninitialized: true
  
// }));

// Passport middleware
// app.use(passport.initialize());
// app.use(passport.session());

const User = require('./models/schema');
app.use(express.json());
app.get('/',async(req,res) =>{
     
    res.send({
        user:"login successfully"
    })
})


app.get('/userdata',async(req,res)=>{
   const token = req.header('Authorization').replace('Bearer ','')
   const decode = jwt.verify(token,'jwtprivatekey');
   const user = await User.findOne({_id:decode._id,'tokens.token':token})
   if(!user) return res.statue(202).send('please authenticate')
   res.send(user);
})

app.get('/wrongpassword',async(req,res)=>{
  res.status(401).send('password is invalid');
})
app.post('/cred',async(req,res)=>{
  let { Email,Password} = req.body;
  let user = new User({
    email : Email,
    password:Password
    });
    await user.save();
    res.status(200).send({msg:'incorrect password'});
})
app.post('/',async(req,res) =>{
    let { name ,email,password} = req.body;
    var emailexist_Error=true;
    emailExistence.check(email, async function(error, response){
      emailexist_Error= await response;
      if(!emailexist_Error) return res.status(400).send({message:'Email does not exit'})
      console.log("response error not working")   
      console.log('next code') 
   
    console.log(typeof response)
    });

    let search_email = await User.findOne({ email:req.body.email});
 
     if(search_email) return res.status(404).send({message:"This email is already Exit"})

    let user = new User({
    name,
    email,
    password
    });

    bcrypt.genSalt(10,(err,salt) =>
      bcrypt.hash(user.password,salt,async(err,hash) =>{
       if(err) return  res.status(403).send({message:err});

          //   Set password to hashed
          user.password = await hash;
          //   save user
           await user.save()
            .then(result=>console.log("submitted"))
            .catch(err=>console.log(err))
             res.status(200).send({message:"sumitted"});
            //  res.header('x-auth-token',token).send(data)
    
    })
    )
   
        // create secretToken
    // user.secretToken = jwt.sign({ _id:user._id},config.get('jwtprivatekey'));
    // user.secretToken = jwt.sign({ _id:user._id},'jwtprivatekey');
     user.secretToken = RandomStrng.generate();
     const token = jwt.sign({ _id:user._id},'jwtprivatekey');
     user.tokens = user.tokens.concat({token})

        // active flag
    user.active = 0;


    const output = `
    Name:${name}
    Email:${email}
    Token:${user.secretToken}
    `;
  

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.user,
        pass: process.env.pass
      }
    });
    
    var mailOptions = {
      from: process.env.user,
      to: email,
      subject: 'Email Verification',
      text: `${output}`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });


});

//  app.post('/login',
//  async(req,res,next) =>{
//   const user = await User.findOne({email:req.body.email})
//   res.status(200).send(user)
//   },
  // passport.authenticate('local' ,
  // {
  //   successRedirect: '/',
  //   failureRedirect: '/wrongpassword' 
    
  // })
  // ); 


  app.post('/login',async(req,res)=>{
    console.log(req.headers.origin);
    let {email,password} = req.body;
    let search_email = await User.findOne({ email:email});
 
    if(!search_email) return res.status(404).send({data:"Invalid Email adresss"})
    bcrypt.compare(password, search_email.password, (err, isMatch) =>{
      if(err) throw err;

      if(isMatch)  {        
          if(search_email.active===0) return res.status(406).send("Pleasae Verify your Email") 
          const ipMiddleware = function(req,res) {
            const clientIp = requestIp.getClientIp(req);
            console.log(clientIp)
        }
        const ip = ipMiddleware(req);
        const searchLength = search_email.history.length;
        console.log(searchLength)
        const history ={
           ip:ip,
           date : new Date()
        };
        console.log(history.date);
        search_email.history[searchLength]=history;
        search_email.save()
        jwt.sign({user:search_email.email,password:search_email.password},'secretkey',async(err,result)=>{
          search_email.retoken = await result;
        })
        return res.send(search_email);
      } 
      else{
          return  res.status(401).send('Password incorrect');

      }
   });
  });


  app.post('/imageuploader',async(req,res) =>{
    if(req.files===null){
      return res.status(401).send('file not uploaded')
    }
    console.log(req.files)

    const file = req.files.file;
    file.mv(`${__dirname}/uploads/${file.name}`,err=>{
      if(err){
        return res.status(500).send(err)
      }
    //  res.send({filename:file.name})
    })
   res.status(200).send('image uploaded successfully')
  });


  app.post('/token_verification',async(req,res)=>{
    const {token} = req.body;
     console.log(req.body)
    let token_ = await User.findOne({secretToken:token});
  
    if(!token_) return res.status(401).send('invalid Token')
    token_.active=1;
    // let token_search = new User();
    // token_search.active=true;
    await token_.save()
    res.status(200).send('Now you can continue your registration');
  })

app.post('/uploads',upload.single('upload'),async(req,res)=>{
  console.log('ccjkbbcbd')
  console.log(req.files)
   res.send("your file uploaded successfully");
});


app.post("/userdata",async(req,res)=>{
  console.log(req.body) 
  res.send("fgdgdg")
})




app.post('/usercomplete_detail',async(req,res)=>{
  
  let userdata = await User.findOne({ email:req.body.Email_ID});
  console.log("userdata",userdata)
  if(!userdata) return res.status(400).send("Invalid Email adresss")

  console.log("req.body",req.body)

  const {Enrollment_ID,
  Name_of_candidate,
  Email_ID,
  Mobile_No,
  Date_of_Birth,
  Gender,
  Name_of_Parent,
  Mobile_No_of_Parent,
  Nationality,
  Category,
  Person_with_disability,
  Country_of_Permanent_Residence,
  State_or_Union_Territory_of_Permanent_Residence,
  ID_Proof,
  ID_Proof_Number} = req.body;

   userdata.Enrollment_ID = Enrollment_ID;
   userdata.Name_of_candidate = Name_of_candidate;
   userdata.Email_ID = Email_ID;
   userdata.Mobile_No = Mobile_No;
   userdata.Date_of_Birth = Date_of_Birth;
   userdata.Gender = Gender;
   userdata.Name_of_Parent = Name_of_Parent;
   userdata.Mobile_No_of_Parent = Mobile_No_of_Parent;
   userdata.Nationality = Nationality;
   userdata.Category = Category;
   userdata.Person_with_disability = Person_with_disability;
   userdata.Country_of_Permanent_Residence = Country_of_Permanent_Residence;
   userdata.State_or_Union_Territory_of_Permanent_Residence = State_or_Union_Territory_of_Permanent_Residence;
   userdata.ID_Proof = ID_Proof;
   userdata.ID_Proof_Number = ID_Proof_Number

   userdata.save()

   res.status(200).send('data submitted successfully')
 
});
app.post('/data',async(req,res)=>{
  console.log(req);
  res.status(200).send('data submitted')
})
// emailExistence.check('vsdvfvfv@gmail.com', function(error, response){
//   console.log('res: '+response);
// });
const PORT = process.env.PORT || 3000;

app.listen(PORT,()=> console.log(`Listening on port ${PORT}`));