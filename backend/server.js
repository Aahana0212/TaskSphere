import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const { MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN = "http://localhost:5173" } = process.env;
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) { console.error("Set MONGODB_URI and a JWT_SECRET of at least 32 characters"); process.exit(1); }
await mongoose.connect(MONGODB_URI);
const userSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, passwordHash: { type: String, required: true } }, { timestamps: true });
const workspaceSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true }, tasks: { type: [mongoose.Schema.Types.Mixed], default: [] }, projects: { type: [mongoose.Schema.Types.Mixed], default: [] }, activities: { type: [mongoose.Schema.Types.Mixed], default: [] }, archivedTasks: { type: [mongoose.Schema.Types.Mixed], default: [] } }, { timestamps: true });
const User = mongoose.model("User", userSchema);
const Workspace = mongoose.model("Workspace", workspaceSchema);
const app = express();
app.get("/api/health", (_req, res) => res.json({ status: mongoose.connection.readyState === 1 ? "ok" : "unavailable" }));
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN.split(",").map(s=>s.trim()), credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
// Browser cookie authentication: require trusted Origin for state-changing requests.
app.use((req,res,next) => { if (["POST","PUT","PATCH","DELETE"].includes(req.method)) { const origin=req.get("origin"); if (!origin || !CLIENT_ORIGIN.split(",").map(s=>s.trim()).includes(origin)) return res.status(403).json({message:"Untrusted origin"}); } next(); });
const limiter = rateLimit({ windowMs: 15*60*1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false });
app.use("/api/auth/login", limiter);
app.use("/api/auth/signup", limiter);
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7*24*60*60*1000 };
const publicUser = u => ({ id: u._id.toString(), name: u.name, email: u.email });
function issueSession(res, user) { const token=jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" }); res.cookie("ts_session",token,cookieOptions); }
function requireAuth(req,res,next) { try { const token=req.cookies.ts_session; if (!token) return res.status(401).json({message:"Not authenticated"}); const payload=jwt.verify(token,JWT_SECRET,{algorithms:["HS256"]}); if (!mongoose.isValidObjectId(payload.sub)) throw Error("Invalid token"); req.userId=payload.sub; next(); } catch { res.status(401).json({message:"Not authenticated"}); } }
app.post("/api/auth/signup",async(req,res,next)=>{try { const name=String(req.body.name||"").trim(); const email=String(req.body.email||"").trim().toLowerCase(); const password=req.body.password; if (name.length<2||name.length>80||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||typeof password!=="string"||password.length<8||password.length>128) return res.status(400).json({message:"Enter a valid name, email, and password (8–128 characters)"}); if(await User.exists({email}))return res.status(409).json({message:"Email is already registered"}); const passwordHash=await bcrypt.hash(password,12); const user=await User.create({name,email,passwordHash}); issueSession(res,user); res.status(201).json({user:publicUser(user)}); }catch(e){if(e.code===11000)return res.status(409).json({message:"Email is already registered"});next(e)} });
app.post("/api/auth/login",async(req,res,next)=>{try {const email=String(req.body.email||"").trim().toLowerCase(); const password=req.body.password; if(typeof password!=="string")return res.status(401).json({message:"Invalid email or password"}); const user=await User.findOne({email}); if(!user||!await bcrypt.compare(password,user.passwordHash))return res.status(401).json({message:"Invalid email or password"}); issueSession(res,user); res.json({user:publicUser(user)});}catch(e){next(e)} });
app.get("/api/auth/me",requireAuth,async(req,res,next)=>{try {const user=await User.findById(req.userId); if(!user)return res.status(401).json({message:"Not authenticated"}); res.json({user:publicUser(user)});}catch(e){next(e)} });
app.post("/api/auth/logout",(req,res)=>{res.clearCookie("ts_session",{...cookieOptions,maxAge:undefined});res.json({message:"Logged out"})});
app.get("/api/workspace",requireAuth,async(req,res,next)=>{try {const w=await Workspace.findOne({userId:req.userId}).lean();res.json({tasks:w?.tasks??[],projects:w?.projects??[],activities:w?.activities??[],archivedTasks:w?.archivedTasks??[]});}catch(e){next(e)} });
app.put("/api/workspace",requireAuth,async(req,res,next)=>{try {const {tasks,projects,activities,archivedTasks}=req.body; if(![tasks,projects,activities,archivedTasks].every(Array.isArray)||tasks.length>5000||projects.length>1000||activities.length>500||archivedTasks.length>5000||![...tasks,...projects,...activities,...archivedTasks].every(item => item && typeof item === "object" && !Array.isArray(item)))return res.status(400).json({message:"Invalid workspace payload"}); await Workspace.findOneAndUpdate({userId:req.userId},{$set:{tasks,projects,activities,archivedTasks}},{upsert:true,new:false,runValidators:true});res.json({message:"Saved"});}catch(e){next(e)} });
app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({message:err.type==="entity.too.large"?"Workspace exceeds 2 MB limit":"Server error"})});
const port=Number(process.env.PORT||5000);app.listen(port,()=>console.log(`TaskSphere API running on http://localhost:${port}`));
