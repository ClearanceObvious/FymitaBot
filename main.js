/*
HOW TO USE DATABASE
const session = {
    name: "Math 101",
    date: new Date("2025-03-30"),
    sessionHours: 2,
    tutorName: "John Doe",
    tutorID: "12345",
    students: [
        { studentName: "Jane Smith", studentId: "stu123" },
        { studentName: "Jake White", studentId: "stu456" }
    ]
};

SET: await setSession(session);
GET: const session = await getSession("Math 101", "12345", new Date("2025-03-30"));
DEL: await removeSession("Math 101", "12345", new Date("2025-03-30"));

ADD: const newStudent = { studentName: "John Doe", studentId: "stu789" };
await addStudentToSession("Math 101", "12345", new Date("2025-03-30"), newStudent);

DEL_STUDENT: await removeStudentFromSession("Math 101", "12345", new Date("2025-03-30"), "stu789");
*/

require('dotenv').config();
const TOKEN = process.env.DISCORD_BOT_TOKEN;

const { Client, GatewayIntentBits } = require('discord.js');
const { MongoClient } = require("mongodb");

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, 
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences,
    ],
  }
);

// Connect to MongoDB
const mongoClient = new MongoClient(process.env.MONGO_URI); let db;
async function connectToMongo() {
    try {
        await mongoClient.connect();
        db = mongoClient.db("fyBotData");
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

// MongoDB Database Methods
async function setSession(sessionData) {
    try {
        const sessionCollection = db.collection("sessions");

        // Ensure sessionData.date is a Date object
        sessionData.date = new Date(sessionData.date);

        const existingSession = await sessionCollection.findOne({
            name: sessionData.name,
            tutorID: sessionData.tutorID,
            date: sessionData.date
        });

        if (existingSession) {
            await sessionCollection.updateOne(
                { _id: existingSession._id },
                { $set: sessionData }
            );
            console.log("Session updated!");
        } else {
            await sessionCollection.insertOne(sessionData);
            console.log("New session created!");
        }
    } catch (err) {
        console.error("Error setting session:", err);
    }
}
async function getSession(name, tutorID, date) {
    try {
        const sessionCollection = db.collection("sessions");

        // Ensure date is a Date object with time included
        date = new Date(date);

        const session = await sessionCollection.findOne({ name, tutorID, date });

        if (session) {
            console.log("Session found:", session);
            return session;
        } else {
            console.log("No session found with those details.");
            return null;
        }
    } catch (err) {
        console.error("Error getting session:", err);
    }
}
async function removeSession(name, tutorID, date) {
    try {
        const sessionCollection = db.collection("sessions");

        // Ensure date is a Date object with time included
        date = new Date(date);

        const result = await sessionCollection.deleteOne({ name, tutorID, date });

        if (result.deletedCount > 0) {
            console.log("Session removed!");
        } else {
            console.log("No session found to remove.");
        }
    } catch (err) {
        console.error("Error removing session:", err);
    }
}

async function addStudentToSession(sessionName, tutorID, date, student) {
    try {
        const sessionCollection = db.collection("sessions");

        // Ensure date is a Date object with time included
        date = new Date(date);

        const result = await sessionCollection.updateOne(
            { name: sessionName, tutorID: tutorID, date: date },
            { $push: { students: student } }
        );

        if (result.modifiedCount > 0) {
            console.log("Student added to session!");
        } else {
            console.log("Session not found or student already exists.");
        }
    } catch (err) {
        console.error("Error adding student to session:", err);
    }
}
async function removeStudentFromSession(sessionName, tutorID, date, studentId) {
    try {
        const sessionCollection = db.collection("sessions");

        // Ensure date is a Date object with time included
        date = new Date(date);

        const result = await sessionCollection.updateOne(
            { name: sessionName, tutorID: tutorID, date: date },
            { $pull: { students: { studentId: studentId } } }
        );

        if (result.modifiedCount > 0) {
            console.log("Student removed from session!");
        } else {
            console.log("Session not found or student does not exist.");
        }
    } catch (err) {
        console.error("Error removing student from session:", err);
    }
}

// Connect to Discord
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await connectToMongo();
});

// Auto add member role
client.on('guildMemberAdd', member => {
    member.roles.add('1354468796806467794');
    member.send(`Welcome, ${member.user.username}! Make sure to take a look around the server, and if you have any questions, type ".help" in "bot-commands".`);
});

// Message Handler
client.on('messageCreate', async message => {
    if (message.content === '.help') {
        message.reply('Hey!')
    } else if (message.content === '.createTest') {
        const session = {
            name: "Math 101",
            date: new Date("2025-03-30"),
            sessionHours: 2,
            tutorName: "John Doe",
            tutorID: "12345",
            students: [
                { studentName: "Jane Smith", studentId: "stu123" },
                { studentName: "Jake White", studentId: "stu456" }
            ]
        };
        await setSession(session);
    } else if (message.content === '.testAdd') {
        const newStudent = { studentName: "John Doe", studentId: "stu789" };
        await addStudentToSession("Math 101", "12345", new Date("2025-03-30"), newStudent);
    }
});

client.login(TOKEN);