import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js" ;
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const {email,password,fullName} = req.body;

  try {
    
    if(!email || !password || !fullName){
      return res.status(400).json({message: "All fields are required"});
    }

    if(password.length < 6){
      return res.status(400).json({message: "Password must be at least 6 characters"});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if(!emailRegex.test(email)){
      return res.status(400).json({message: "Invalid email format"});
    }

    const existingUser = await User.findOne({ email });
    if(existingUser){
      return res.status(400).json({message : "Email already exists"})
    }

    //////// Generating random icon placeholder
    //avatar.placeholder.iran.liara.run
    //const indx = Math.floor(Math.random() * 100) + 1;// Generates a number between 1 and 100

    const randomAvatar =  generateRandomAvatarUrl();
    const userName = generateRandomUserName(fullName);

    const newUser = await User.create({
      email,
      fullName,
      userName,
      password,
      profilePic: randomAvatar,
      bio: "no bio, this space is still loading…",
    })

    // TODO: Create the user is STREAM as well
    //--
    //--
    //--

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`)
    } catch (error) {
      console.log("Error creating Stream user: ", error);
    }




    // The following function takes as parameters firstly 
    //(payload) the id of the user to assign th json web token to him 
    //second the secret key and we put it in the environment variables
    //third it takes options such as expiry date of this jwt
    const token = jwt.sign({userId: newUser._id},process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7D"
      }
    )


    //Setting the jwt in cookie and sending it
    //The following cookie function takes as first parameter
    //the name of this cookie 
    //second the thing to put in the cookie which is here jwt token generated before
    //third are some options such as maxAge (in ms)
    res.cookie("jwt",token,{
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production", // prevent HTTP requests
    })

    res.status(201).json({success:true, user:newUser})

  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

}

export async function login(req, res) {
  try {
    const { email, password } = req.body;


    if(!email || !password){
      return res.status(400).json({message: "Please enter all fields"})
    }

    const user = await User.findOne({email});
    if(!user) return res.status(400).json({message: "Invalid credentials"});

    const isPasswordCorrrect = await user.matchPassword(password);
    if(!isPasswordCorrrect) return res.status(400).json({message: "Invalid credentials"});
    

    const token = jwt.sign({userId: user._id},process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7D"
      }
    )

    res.cookie("jwt", token,
      {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // prevent XSS attacks,
        sameSite: "strict", // prevent CSRF attacks
        secure: process.env.NODE_ENV === "production", // prevent HTTP requests
      }
    )

    res.status(200).json({success: true, user});

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(400).json({message: "Internal server errors"})
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({message: "Logout successful"})
}


export async function onboard(req,res){
  try {
    const userId = req.user._id;

    if(!userId){
      return res.status(400).json({ message: "User not found"});
    }

    const {userName, nativeLanguage, learningLanguage, location, bio, profilePic} = req.body;


    if(!userName || !bio || !nativeLanguage || !learningLanguage || !location){
      return res.status(400).json({ 
        message: "Please enter all fields",
        missingFields: [
          !userName && "profile name",
          !bio && "bio",
          !nativeLanguage && "native language",
          !learningLanguage && "learning language",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const checkUserName = await User.findOne({ 
      userName,
      _id: { $ne: userId },
     });

    
    if(checkUserName){
      return res.status(400).json({ message: "Profile name already exists." })
    }
    

    const updatedUser = await User.findByIdAndUpdate(userId,
      {
        //...req.body // this get all attributes: fullname, bio, etc...
        userName, 
        nativeLanguage,
        learningLanguage,
        location,
        bio,
        profilePic,
        isOnboarded: true,
      }, {new: true} // if new set to true then this function will return 
                     // the object after update was applied
                     // if not set then will return th document as it was before update was applied
    );

    if(!updatedUser){
      return res.status(400).json({ message: "There was a problem while updating user infromation"})
    }


    // UPDATE THE USER INFO IN STREAM

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.userName,
        image: updatedUser.profilePic || "",
      })
      console.log(`Stream user updated after onboaring for ${updatedUser.fullName} `);
      
    } catch (streamError) {
      console.log("Error updating user during onboarding", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser});
    
  } catch (error) {
    console.log("Onboaring error: ", error);
    res.status(500).json({ message: "Internal Server Error"})
  }
}



export async function getAvatar(req,res){

  try {
    
    const randomAvatar = generateRandomAvatarUrl();
    
    return res.status(200).json({image: randomAvatar});
  } catch (error) {
    return res.status(400).json({message: "Error in generating avatar"})
  }


}

export async function setAvatar(req,res){
  res.send("New avatar placeholder")
}

function generateRandomAvatarUrl() {
  const backgroundColor = ["c0aede","d1d4f9","ffdfbf","ffd5dc","b6e3f4"];
  const backgroundType = ["gradientLinear"];
  const backgroundRotation = Math.floor(Math.random() * 180);
  const accessories = ["catEars","glasses","mustache",
                  "sailormoonCrown","sleepMask","sunglasses"
                  ];
  const accessoriesProbability = [0,100];
  const eyes = ["cheery","confused","normal","starstruck","winking"];
  const hair = ["bangs","bowlCutHair","braids","bunHair",
            "curlyBob","curlyShortHair","froBun","halfShavedHead",
            "mohawk","shortHair","straightHair","wavyBob"
            ];
  const hairColor = ["220f00","238d80","3a1a00","605de4",
                "71472d","d56c0c","e2ba87","e9b729"
                ];
  const mouth = ["openedSmile","teethSmile","unimpressed","braces"];
  const skinColor = ["8c5a2b","a47539","c99c62",
                "e2ba87","efcc9f","f5d7b1"
                ];

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  return `https://api.dicebear.com/9.x/big-smile/png?backgroundType=${getRandomElement(backgroundType)}&backgroundColor=${getRandomElement(backgroundColor)},${getRandomElement(backgroundColor)}&backgroundRotation=${backgroundRotation}&accessoriesProbability=${getRandomElement(accessoriesProbability)}&accessories=${getRandomElement(accessories)}&eyes=${getRandomElement(eyes)}&mouth=${getRandomElement(mouth)}&hair=${getRandomElement(hair)}&hairColor=${getRandomElement(hairColor)}&skinColor=${getRandomElement(skinColor)}`;
}

function generateRandomUserName(fullName) {
  const base = fullName.trim().toLowerCase().replace(/\s+/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${base}${randomNum}`;
}