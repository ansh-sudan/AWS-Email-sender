const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');
const scheduledTasks = [];

const app = express();
const upload = multer();

require('dotenv').config();

// app.use(cors());
app.use(cors({
    origin:['http://localhost:3001'],
}));

app.use(express.json());

console.log(process.env.Email);
console.log(process.env.Password);

// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.Email,
        pass: process.env.Password
    }
});



const emailContents = {
    format1: (companyName, companyPost, companyPostURL) => ({
        text: '',
        html: `Respected Hiring Manager,<br/><br/>
    My name is Ansh Sudan, and I recently graduated pursuing a Bachelor of Computer Applications with a minor specialization in Data Science and Analytics from GGSIPU. I am actively seeking job opportunities. I recently interned at Jio Platforms as a Data Science Intern, working on predictive analytics and time series data. <br/><br/>
    I am very interested in Data Analytics and have upskilled myself in technologies such as Python, SQL, Alteryx, and Power BI.<br/><br/>
    I assure you of full diligence in my work and therefore I am also attaching my work sample in this email which shows my logical skills and way of solving a problem effectively and efficiently. Therefore, I've applied for an entry-level opening at ${companyName} for the position of <a href="${companyPostURL}">${companyPost}</a>, and would appreciate it if you could kindly view it once.<br/><br/>
    These are some of my work samples for your reference:<br/>
    <a href="https://github.com/ansh-sudan">Github</a><br/>
    <a href="https://www.linkedin.com/in/ansh-sudan-7aa596229/">LinkedIn</a><br/>
    <a href="https://github.com/ansh-sudan/EDA-on-Zomato-Dataset-">EDA on Zomato Dataset</a><br/>
    <a href="https://github.com/ansh-sudan/Power-BI-Dashhboard-on-Modi-Store">Dashboard using Power BI</a><br/><br/>
    PFA<br/>
    1) Cover Letter<br/>
    2) CV<br/><br/>
    Thank you for your time and consideration. Kindly contact me if any other opportunity comes up as well.<br/><br/>
    --<br/>
    Regards,<br/>
    Ansh Sudan<br/>
    9717338382`
    }),
    format2: {
        text: '',
        html: `Respected Hiring Manager,<br/><br/>
    My name is Ansh Sudan, and I recently graduated pursuing a Bachelor of Computer Applications with a minor specialization in Data Science and Analytics from GGSIPU. I am actively seeking job opportunities. I recently interned at Jio Platforms as a Data Science Intern, working on predictive analytics and time series data.<br/><br/>
    I am very interested in Data Analytics and have upskilled myself in technologies such as Python, SQL, Alteryx, and Power BI.<br/><br/>
    I assure you that I will be very diligent in my work and I am also attaching my work sample in this email which shows my logical skills and way of solving a problem effectively and efficiently. I wanted to apply for any vacant position in this particular field at your company.<br/><br/>
    These are some of my work samples for your reference:<br/>
    <a href="https://github.com/ansh-sudan">Github</a><br/>
    <a href="https://www.linkedin.com/in/ansh-sudan-7aa596229/">LinkedIn</a><br/>
    <a href="https://github.com/ansh-sudan/EDA-on-Zomato-Dataset-">EDA on Zomato Dataset</a><br/>
    <a href="https://github.com/ansh-sudan/Power-BI-Dashhboard-on-Modi-Store">Dashboard using Power BI</a><br/><br/>
    PFA<br/>
    1) CV<br/>
    2) Cover Letter<br/><br/>
    Thank you for your time and consideration. Kindly contact me if any opportunity comes up.<br/><br/>
    --<br/>
    Regards,<br/>
    Ansh Sudan<br/>
    9717338382`
    },
    format3: (companyName, companyPost, companyPostURL) => ({
        text: '',
        html: `Respected Hiring Manager,<br/><br/>
    My name is Ansh Sudan, and I I recently graduated pursuing a Bachelor of Computer Applications with a minor specialization in Data Science and Analytics from GGSIPU. I am actively seeking job opportunities. I recently interned at Jio Platforms as a Data Science Intern, working on predictive analytics and time series data. <br/><br/>
    I am very interested in Data Analytics and have upskilled myself in technologies such as Python, SQL, Alteryx, and Power BI.<br/><br/>
    I assure you that I will be very diligent in my work and I am also attaching my work sample in this email which shows my logical skills and way of solving a problem effectively and efficiently. I wanted to apply for any vacant position in this particular field at your company.<br/><br/>
    These are some of my work samples for your reference:<br/>
    <a href="https://github.com/ansh-sudan">Github</a><br/>
    <a href="https://www.linkedin.com/in/ansh-sudan-7aa596229/">LinkedIn</a><br/>
    <a href="https://github.com/ansh-sudan/EDA-on-Zomato-Dataset-">EDA on Zomato Dataset</a><br/>
    <a href="https://github.com/ansh-sudan/Power-BI-Dashhboard-on-Modi-Store">Dashboard using Power BI</a><br/><br/>
    PFA<br/>
    1) CV<br/>
    2) Cover Letter<br/><br/>
    Thank you for your time and consideration. Kindly contact me if any opportunity comes up.<br/><br/>
    --<br/>
    Regards,<br/>
    Ansh Sudan<br/>
    9717338382`
    })
};

app.post('/schedule-email', upload.none(), (req, res) => {
    const { emails, format, subject, companyName, companyPost, companyPostURL, scheduleTime } = req.body;

    try {
        scheduleEmail({ emails, format, subject, companyName, companyPost, companyPostURL, scheduleTime });
        res.status(200).send('Email scheduled successfully');
    } catch (error) {
        console.error('Error scheduling email:', error);
        res.status(500).send('Error scheduling email: ' + error.toString());
    }
});


app.get('/scheduled-emails', (req, res) => {
    res.status(200).json(scheduledTasks.map(task => ({
        emails: task.emails,
        format: task.format,
        subject: task.subject,
        companyName: task.companyName,
        companyPost: task.companyPost,
        companyPostURL: task.companyPostURL,
        scheduleTime: task.scheduleTime
    })));
});

app.delete('/delete-scheduled-email/:index', (req, res) => {
    const index = parseInt(req.params.index);

    if (index >= 0 && index < scheduledTasks.length) {
        const [removedTask] = scheduledTasks.splice(index, 1);
        removedTask.task.stop();
        res.status(200).send(`Scheduled email at index ${index} has been deleted.`);
    } else {
        res.status(400).send('Invalid index.');
    }
});

// Endpoint to update a scheduled email by index
app.put('/update-scheduled-email/:index', upload.none(), (req, res) => {
    const index = parseInt(req.params.index, 10);
    const { emails, format, subject, companyName, companyPost, companyPostURL, scheduleTime } = req.body;

    if (index < 0 || index >= scheduledTasks.length) {
        return res.status(400).send('Invalid index');
    }

    // Update the scheduled email details
    scheduledTasks[index] = {
        emails,
        format,
        subject,
        companyName,
        companyPost,
        companyPostURL,
        scheduleTime,
        task: scheduledTasks[index].task // Keep the existing task
    };

    // Reschedule the task
    scheduledTasks[index].task.stop();
    scheduledTasks[index].task = cron.schedule(scheduleTime, () => {
        const emailList = emails.split(',').map(email => email.trim());
        let emailContent;
        if (format === 'format1' || format === 'format3') {
            emailContent = emailContents[format](companyName, companyPost, companyPostURL);
        } else {
            emailContent = emailContents[format];
        }

        const attachments = [
            {
                filename: 'Curriculum Vitae Ansh Sudan.pdf',
                content: fs.readFileSync('Ansh Sudan Resume.pdf'),
                contentType: 'application/pdf'
            },
            {
                filename: 'Ansh Cover Letter.pdf',
                content: fs.readFileSync('Coverletter.pdf'),
                contentType: 'application/pdf'
            }
        ];

        emailList.forEach(email => {
            const mailOptions = {
                from: '"Ansh Sudan" <sudanansh1@gmail.com>',
                to: email,
                subject: subject || 'Default Subject',
                text: emailContent.text,
                html: emailContent.html,
                attachments: attachments
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${email}:`, error);
                } else {
                    console.log(`Email sent to ${email}:`, info.response);
                }
            });
        });
    }, {
        timezone: 'Asia/Kolkata'
    });

    res.status(200).send('Scheduled email updated successfully');
});



app.post('/send-email', upload.none(), (req, res) => {
    const { emails, format, subject, companyName, companyPost, companyPostURL } = req.body;

    // Split the emails by comma and trim whitespace
    const emailList = emails.split(',').map(email => email.trim());

    // Generate email content based on the format and parameters
    let emailContent;
    if (format === 'format1' || format === 'format3') {
        emailContent = emailContents[format](companyName, companyPost, companyPostURL);
    } else {
        emailContent = emailContents[format];
    }

    const attachments = [
        {
            filename: 'Curriculum Vitae Ansh Sudan.pdf',
            content: fs.readFileSync('Ansh Sudan Resume.pdf'),
            contentType: 'application/pdf'
        },
        {
            filename: 'Ansh Cover Letter.pdf',
            content: fs.readFileSync('Coverletter.pdf'),
            contentType: 'application/pdf'
        }
    ];

    // Send emails individually
    let emailPromises = emailList.map(email => {
        const mailOptions = {
            from: '"Ansh Sudan" <sudanansh1@gmail.com>',
            to: email,
            subject: subject || 'Default Subject',
            text: emailContent.text,
            html: emailContent.html,
            attachments: attachments
        };

        return transporter.sendMail(mailOptions);
    });

    // Handle the promises
    Promise.all(emailPromises)
        .then(results => {
            res.status(200).send('All emails sent successfully');
        })
        .catch(error => {
            res.status(500).send('Error sending emails: ' + error.toString());
        });
});

function scheduleEmail({ emails, format, subject, companyName, companyPost, companyPostURL, scheduleTime }) {
    const task = cron.schedule(scheduleTime, () => {
        const emailList = emails.split(',').map(email => email.trim());
        let emailContent;
        if (format === 'format1' || format === 'format3') {
            emailContent = emailContents[format](companyName, companyPost, companyPostURL);
        } else {
            emailContent = emailContents[format];
        }

        const attachments = [
            {
                filename: 'Curriculum Vitae Ansh Sudan.pdf',
                content: fs.readFileSync('Ansh Sudan Resume.pdf'),
                contentType: 'application/pdf'
            },
            {
                filename: 'Ansh Cover Letter.pdf',
                content: fs.readFileSync('Coverletter.pdf'),
                contentType: 'application/pdf'
            }
        ];

        emailList.forEach(email => {
            const mailOptions = {
                from: '"Ansh Sudan" <sudanansh1@gmail.com>',
                to: email,
                subject: subject || 'Default Subject',
                text: emailContent.text,
                html: emailContent.html,
                attachments: attachments
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${email}:`, error);
                } else {
                    console.log(`Email sent to ${email}:`, info.response);
                }
            });
        });

        // Remove the task from the list and stop it after execution
        const taskIndex = scheduledTasks.findIndex(t => t.task === task);
        if (taskIndex !== -1) {
            scheduledTasks.splice(taskIndex, 1);
            console.log(`Scheduled email task for ${emails} removed after execution.`);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    scheduledTasks.push({ emails, format, subject, companyName, companyPost, companyPostURL, scheduleTime, task });
}

// Send index.html file to the client if the route is '/' or '/index.html'

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/backend.html');
});


// const PORT = process.env.PORT || 3001;
const PORT = 4001;
app.listen(PORT, () => {

  // Test the email transporter connection on server start up
  transporter.verify((error, success) => {
    if (error) {
      console.error("Error connecting to email transporter:", error);
    } else {
      console.log("Email transporter connected successfully");
    }
  });

    console.log(`Server is running on port ${PORT}`);
});
