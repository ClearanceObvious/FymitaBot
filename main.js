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

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
async function applyToSession(sessionName, studentName, studentId) {
    try {
        const sessionCollection = db.collection("sessions");

        // Find the session by name (ignoring date & tutorID)
        const session = await sessionCollection.findOne({ name: sessionName });

        if (!session) {
            console.log(`❌ No session found with the name: ${sessionName}`);
            return false;
        }

        // Create new student object
        const newStudent = { studentName, studentId };

        // Check if the student already exists in the session
        const studentExists = session.students.some(s => s.studentId === studentId);
        if (studentExists) {
            console.log(`Student ${studentName} is already in session "${sessionName}".`);
            return false;
        }

        // Add the new student to the session
        await sessionCollection.updateOne(
            { name: sessionName }, // Find the session
            { $push: { students: newStudent } } // Add student to the students array
        );

        console.log(`Successfully added ${studentName} to session "${sessionName}".`);
        return true;
    } catch (err) {
        console.error("Error adding student to session:", err);
        return false;
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

async function getSessionByName(scheduleName) {
    try {
        const scheduleCollection = db.collection("sessions");

        // Find the schedule by its name
        const schedule = await scheduleCollection.findOne({ name: scheduleName });

        if (!schedule) {
            console.log(`❌ No Session found with the name: ${scheduleName}`);
            return null;
        }

        console.log(`Found Session`);
        return schedule;
    } catch (err) {
        console.error("Error fetching Session:", err);
        return null;
    }
}

function hasAllowedRoles(member) {
    const allowedRoles = ['1354466746278346842', '1354467923833655459', '1354467270570672388'];
    return member.roles.cache.some(role => allowedRoles.includes(role.id));
}

function isOwner(member) {
    return member.roles.cache.has('1354466746278346842');
}

function isMember(member) {
    return member.roles.cache.has('1354468796806467794');
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
        message.reply('Hey! Help section not done yet.')
    /*} else if (message.content === '.createTest') {
        const session = {
            name: "Math 101",
            date: new Date("2025-03-30T14:00:00"),
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
        await addStudentToSession("Math 101", "12345", new Date("2025-03-30T14:00:00"), newStudent); */
    } else if (message.content.split(' ')[0] === '.create' && hasAllowedRoles(message.member)) { // Formula: .create <name> <dateDay> <dateHour> <sessionHours> <tutorName> <tutorID>
        let args = message.content.split(' ');
        if (args.length < 7) {
            message.reply('Please provide all required arguments: <name> <date> <sessionHours> <tutorName> <tutorID>');
            return;
        }

        const session = {
            name: args[1],
            date: new Date(`${args[2]}T${args[3]}`),
            sessionHours: parseInt(args[4]),
            tutorName: args[5],
            tutorID: args[6],
            students: []
        };

        await setSession(session);
        message.reply(`Session ${args[1]} created!`);
    } else if (message.content.split(' ')[0] === '.cancel' && isOwner(message.member)) { // Formula: .cancel <name> <tutorID> <dateDay> <dateHour>
        let args = message.content.split(' ')

        if (args.length < 5) {
            message.reply('Please provide all required arguments: <name>');
            return;
        }

        const session = {
            name: args[1],
            date: new Date(`${args[3]}T${args[4]}`),
            tutorID: args[2]
        };

        await removeSession(session.name, session.tutorID, session.date);
        message.reply('Session cancelled!');
    } else if (message.content.split(' ')[0] === '.add' && isOwner(message.member)) { // Formula: .add <name> <studentName> <studentId>
        let args = message.content.split(' ')

        if (args.length < 2) {
            message.reply('Please provide all required arguments: <name> <studentName> <studentId>');
            return;
        }

        const scheduleName = args[1];
        const memberId = args[3];
        const memberName = args[2];

        await applyToSession(scheduleName, memberName, memberId);
        
        let user = await client.users.fetch(memberId);
        await user.send(`You have been successfully added to the session ${scheduleName}!`);

    } else if (message.content.split(' ')[0] === '.remove' && isOwner(message.member)) { // Formula: .remove <name> <tutorID> <dateDay> <dateHour> <studentId>
        let args = message.content.split(' ')

        if (args.length < 6) {
            message.reply('Please provide all required arguments: <name> <tutorID> <dateDay> <dateHour> <studentId>');
            return;
        }

        await removeStudentFromSession(args[1], args[2], new Date(`${args[3]}T${args[4]}`), args[5]);
        message.reply('Student removed from session!');
    } else if (message.content.split(' ')[0] === '.apply' & isMember(message.member)) // Formula: .apply scheduleName
    {
        let scheduleName = message.content.split(' ')[1];
        let userID = message.author.id;
        let userName = message.author.username;

        let schedule = await getSessionByName(scheduleName);
        let scheduleTutor = schedule.tutorName;
        let scheduleTime = schedule.sessionHours;
        let scheduleCost = scheduleTime * 10;

        const thread = await message.channel.threads.create({
            name: `Application for ${scheduleName}`,
            autoArchiveDuration: 10080, // Auto-Archive after 7 days
            reason: `Application for ${scheduleName} by ${userName}`,
            type: 12, // PRIVATE_THREAD
            invitable: false,
        });

        await thread.members.add(userID);
        await thread.members.add(message.guild.ownerId);

        const embed = new EmbedBuilder()
            .setTitle(`${userName} applied for ${scheduleName} with ${scheduleTutor}`)
            .setDescription(`Schedule **${scheduleName}** will take **${scheduleTime}** ${scheduleTime === 1 ? 'hour' : 'hours'}, thus costing ***${scheduleCost}€***.\n\nComplete the Application by ***sending fymitagroup@gmail.com ${scheduleCost}€ on paypal and sending proof of it in this thread.***`)
            .setColor(0x1E90FF)
            .setTimestamp()
            .setFooter({ text: 'Once purchase is completed and proof of it is shown, this thread will close.' });

        thread.send({ embeds: [embed] });
    } else if (message.content.split(' ')[0] === '.clearThreads' & isOwner(message.member)) {
        try {
            const guild = message.guild;
    
            for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased() && channel.threads) {
                    const activeThreads = await channel.threads.fetchActive();
                    for (const thread of activeThreads.threads.values()) {
                        try {
                            await thread.delete();
                            console.log(`✅ Deleted active thread: ${thread.name}`);
                        } catch (err) {
                            console.error(`❌ Failed to delete active thread ${thread.name}:`, err);
                        }
                    }
    
                    const archivedThreads = await channel.threads.fetchArchived({ limit: 100 });
                    for (const thread of archivedThreads.threads.values()) {
                        try {
                            await thread.delete();
                            console.log(`✅ Deleted archived thread: ${thread.name}`);
                        } catch (err) {
                            console.error(`❌ Failed to delete archived thread ${thread.name}:`, err);
                        }
                    }
                }
            }
    
            console.log("All threads have been deleted!");
    
        } catch (error) {
            console.error("Error deleting threads:", error);
        }
    }
});

client.login(TOKEN);